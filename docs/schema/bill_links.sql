-- Public bill links: every bill gets a random share code, and /b/<code> shows that one bill
-- to anyone holding the link. Safe to run more than once. Until it is run the app shares
-- bills without a link.

create or replace function public.vh_share_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789', get_byte(b, i) % 56 + 1, 1), '' order by i)
  from extensions.gen_random_bytes(12) as b, generate_series(0, 11) as i
$$;

alter table public.invoices add column if not exists share_code text;
update public.invoices set share_code = public.vh_share_code() where share_code is null;
alter table public.invoices alter column share_code set default public.vh_share_code();
alter table public.invoices alter column share_code set not null;
create unique index if not exists invoices_share_code_idx on public.invoices (share_code);

-- What /b/<code> and its link preview show: the shop, the bill, payments made on it, and
-- when something is still due, the customer's total due across bills (phone customers only,
-- since names are not unique). The phone number is never returned.
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
    'wa_channel', max(s.value #>> '{}') filter (where s.key = 'wa_channel')
  ) into v_shop
  from public.shop_settings s
  where s.key in ('shop_name', 'tagline', 'phone', 'upi_id', 'whatsapp', 'wa_channel');

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
revoke all on function public.vh_share_code() from public, anon;
grant execute on function public.vh_share_code() to authenticated, service_role;

notify pgrst, 'reload schema';
