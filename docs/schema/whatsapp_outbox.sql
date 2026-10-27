-- WhatsApp outbox: customer consent and greeting dates, a send log, and pay-now links.
-- Safe to run more than once. Until it is run the app keeps consent and the send log
-- in this browser and leaves {pay_link} out of messages.

-- Consent for offers, and dates for greetings. Birthday and anniversary only use the
-- month and day; the app stores the year as 2000.
alter table public.customers add column if not exists wa_optin boolean not null default false;
alter table public.customers add column if not exists wa_optin_at timestamp with time zone;
alter table public.customers add column if not exists wa_optout_at timestamp with time zone;
alter table public.customers add column if not exists birthday date;
alter table public.customers add column if not exists anniversary date;

-- One row per message opened in WhatsApp (sent) or passed over (skipped). Used so nobody
-- gets the same campaign twice, for the reminder and offer limits, and for "last messaged".
-- customer_key is the app's grouping: phone:<last 10 digits>, else name:<trimmed lowercase>.
create table if not exists public.wa_log (
  id uuid primary key default gen_random_uuid(),
  customer_key text not null,
  phone text,
  template text,
  kind text not null check (kind in ('dues', 'thanks', 'marketing')),
  campaign text,
  text text,
  status text not null default 'sent' check (status in ('sent', 'skipped')),
  author text,
  created_at timestamp with time zone not null default now()
);

create index if not exists wa_log_customer_idx on public.wa_log (customer_key, created_at desc);
create index if not exists wa_log_created_idx on public.wa_log (created_at desc);

alter table public.wa_log enable row level security;

drop policy if exists wa_log_rw on public.wa_log;
create policy wa_log_rw on public.wa_log for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- A pay-now link sent in a dues message. The random token is the only way to open it.
create table if not exists public.pay_links (
  token uuid primary key default gen_random_uuid(),
  customer_key text not null,
  created_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null default now() + interval '30 days'
);

create index if not exists pay_links_customer_idx on public.pay_links (customer_key, expires_at desc);

alter table public.pay_links enable row level security;

drop policy if exists pay_links_rw on public.pay_links;
create policy pay_links_rw on public.pay_links for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Signed-out visitors never read these tables directly, only through get_pay_page.
revoke all on public.wa_log from anon;
revoke all on public.pay_links from anon;

-- Shop name, UPI ID and WhatsApp link for the pay page. Same table as sticker_designer.sql.
create table if not exists public.shop_settings (
  key text primary key,
  value jsonb,
  updated_at timestamp with time zone not null default now()
);

alter table public.shop_settings enable row level security;

drop policy if exists shop_settings_rw on public.shop_settings;
create policy shop_settings_rw on public.shop_settings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- The app's customer key for a bill: phone:<last 10 digits>, else name:<trimmed lowercase>.
create or replace function public.vh_customer_key(p_name text, p_phone text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when length(right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10)) = 10
      then 'phone:' || right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10)
    else 'name:' || lower(regexp_replace(coalesce(p_name, ''), '^\s+|\s+$', '', 'g'))
  end
$$;

revoke all on function public.vh_customer_key(text, text) from public, anon;
grant execute on function public.vh_customer_key(text, text) to authenticated, service_role;

create index if not exists invoices_customer_key_idx
  on public.invoices (public.vh_customer_key("customerName", "customerNumber"));

-- The public pay page. Given a live token it returns the shop's name, UPI ID and WhatsApp
-- link, the customer's first name, and their bills with money still due. Nothing else:
-- no phone numbers, no items, no other customers. What is due matches the app: recording
-- a payment already lowers invoices.credit, so dues are the sum of credit still above zero.
create or replace function public.get_pay_page(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_key text;
  v_expires timestamp with time zone;
  v_shop jsonb;
  v_first_name text;
  v_bills jsonb;
  v_total bigint;
begin
  select l.customer_key, l.expires_at into v_key, v_expires
  from public.pay_links l
  where l.token = p_token;

  if v_key is null then
    return null;
  end if;

  select jsonb_build_object(
    'shop_name', max(s.value #>> '{}') filter (where s.key = 'shop_name'),
    'upi_id', max(s.value #>> '{}') filter (where s.key = 'upi_id'),
    'whatsapp', max(s.value #>> '{}') filter (where s.key = 'whatsapp')
  ) into v_shop
  from public.shop_settings s
  where s.key in ('shop_name', 'upi_id', 'whatsapp');

  if v_expires < now() then
    return v_shop || jsonb_build_object('expired', true);
  end if;

  select initcap(split_part(regexp_replace(i."customerName", '^\s+|\s+$', '', 'g'), ' ', 1)) into v_first_name
  from public.invoices i
  where public.vh_customer_key(i."customerName", i."customerNumber") = v_key
  order by i.date desc
  limit 1;

  select coalesce(sum(i.credit), 0) into v_total
  from public.invoices i
  where i.credit > 0
    and public.vh_customer_key(i."customerName", i."customerNumber") = v_key;

  select coalesce(jsonb_agg(jsonb_build_object('bill_no', b.id, 'date', b.date, 'due', b.credit) order by b.date), '[]'::jsonb)
  into v_bills
  from (
    select i.id, i.date, i.credit
    from public.invoices i
    where i.credit > 0
      and public.vh_customer_key(i."customerName", i."customerNumber") = v_key
    order by i.date
    limit 100
  ) b;

  return v_shop || jsonb_build_object(
    'expired', false,
    'first_name', v_first_name,
    'bills', v_bills,
    'total_due', v_total
  );
end;
$$;

revoke all on function public.get_pay_page(uuid) from public;
grant execute on function public.get_pay_page(uuid) to anon, authenticated, service_role;

-- Make PostgREST see the new tables, columns and functions straight away.
notify pgrst, 'reload schema';
