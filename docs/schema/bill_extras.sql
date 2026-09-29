-- Extras for bill links and the installed app. Safe to run more than once.
--
-- 1. Seen ticks: the bill page tells the database when a customer opens the link, and the app
--    shows it on the bill and in Customers. Opens by signed-in staff are not counted.
-- 2. The bill page gets three more shop values (exchange window, exchange note, Google review
--    link), set in WhatsApp > Rules. Nothing shows until they are filled in.
-- 3. push_subscriptions: phones that asked for the Close the day reminder.
--
-- Before running: snapshot the current get_public_bill and invoices into a backup schema.
-- No existing rows change; it adds three columns to invoices and replaces get_public_bill.

alter table public.invoices
  add column if not exists first_seen_at timestamptz,
  add column if not exists last_seen_at timestamptz,
  add column if not exists seen_count integer not null default 0;

-- A reload or a second tap within 30 minutes counts as the same open.
create or replace function public.mark_bill_seen(p_code text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.invoices
  set first_seen_at = coalesce(first_seen_at, now()),
      seen_count = case
        when last_seen_at is null or last_seen_at < now() - interval '30 minutes' then seen_count + 1
        else seen_count
      end,
      last_seen_at = now()
  where p_code ~ '^[A-Za-z0-9]{8,32}$' and share_code = p_code;
$$;

revoke all on function public.mark_bill_seen(text) from public;
grant execute on function public.mark_bill_seen(text) to anon, authenticated, service_role;

create or replace function public.get_public_bill(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_bill public.invoices;
  v_key text;
  v_shop jsonb;
  v_payments jsonb;
  v_customer_due bigint := 0;
  v_due_bills int := 0;
begin
  if p_code is null or p_code !~ '^[A-Za-z0-9]{8,32}$' then
    return null;
  end if;

  select * into v_bill from public.invoices i where i.share_code = p_code;
  if v_bill.id is null then
    return null;
  end if;

  select jsonb_build_object(
    'shop_name', max(s.value #>> '{}') filter (where s.key = 'shop_name'),
    'tagline', max(s.value #>> '{}') filter (where s.key = 'tagline'),
    'phone', max(s.value #>> '{}') filter (where s.key = 'phone'),
    'upi_id', max(s.value #>> '{}') filter (where s.key = 'upi_id'),
    'whatsapp', max(s.value #>> '{}') filter (where s.key = 'whatsapp'),
    'wa_channel', max(s.value #>> '{}') filter (where s.key = 'wa_channel'),
    'exchange_days', max(s.value #>> '{}') filter (where s.key = 'exchange_days'),
    'exchange_note', max(s.value #>> '{}') filter (where s.key = 'exchange_note'),
    'google_review_url', max(s.value #>> '{}') filter (where s.key = 'google_review_url')
  ) into v_shop
  from public.shop_settings s
  where s.key in ('shop_name', 'tagline', 'phone', 'upi_id', 'whatsapp', 'wa_channel', 'exchange_days', 'exchange_note', 'google_review_url');

  if to_regclass('public.credit_payments') is not null then
    execute $q$
      select coalesce(jsonb_agg(jsonb_build_object('amount', p.amount, 'method', p.method, 'paid_on', p.paid_on) order by p.paid_on, p.created_at), '[]'::jsonb)
      from public.credit_payments p
      where p.invoice_id = $1 and p.invoice_date = $2
    $q$ into v_payments using v_bill.id, v_bill.date;
  end if;

  v_key := public.vh_customer_key(v_bill."customerName", v_bill."customerNumber");
  if coalesce(v_bill.credit, 0) > 0 and v_key like 'phone:%' then
    select coalesce(sum(i.credit), 0), count(*) into v_customer_due, v_due_bills
    from public.invoices i
    where i.credit > 0
      and public.vh_customer_key(i."customerName", i."customerNumber") = v_key;
  end if;

  return jsonb_build_object(
    'shop', coalesce(v_shop, '{}'::jsonb),
    'bill', jsonb_build_object(
      'id', v_bill.id,
      'date', v_bill.date,
      'customer_name', v_bill."customerName",
      'phone_last4', nullif(right(regexp_replace(coalesce(v_bill."customerNumber", ''), '\D', '', 'g'), 4), ''),
      'products', v_bill.products,
      'total', v_bill.total,
      'cash', coalesce(v_bill.cash, 0),
      'upi', coalesce(v_bill.upi, 0),
      'credit', coalesce(v_bill.credit, 0),
      'note', v_bill.note
    ),
    'payments', coalesce(v_payments, '[]'::jsonb),
    'customer_due', v_customer_due,
    'due_bills', v_due_bills
  );
end;
$$;

revoke all on function public.get_public_bill(text) from public;
grant execute on function public.get_public_bill(text) to anon, authenticated, service_role;

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
drop policy if exists push_subscriptions_rw on public.push_subscriptions;
create policy push_subscriptions_rw on public.push_subscriptions
  for all to authenticated using (true) with check (true);

notify pgrst, 'reload schema';
