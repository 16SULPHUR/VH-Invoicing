-- Shop books: bank account, supplier and expense accounts, journal entries, customer
-- remarks, and the Home / Shop balance page.
--
-- BEFORE RUNNING, snapshot what this touches:
--   create schema if not exists backup_20261013;
--   create table backup_20261013.chart_of_accounts as table public.chart_of_accounts;
--   create table backup_20261013.transactions as table public.transactions;
--   create table backup_20261013.transaction_lines as table public.transaction_lines;
--   create table backup_20261013.customers as table public.customers;
--   create table backup_20261013.cash_accounts as table public.cash_accounts;
--   create table backup_20261013.cash_transactions as table public.cash_transactions;
--
-- Additive except one rename: the "UPI" account becomes "Bank" (there is one bank account,
-- so UPI money lands there). Bills, credit_payments, supplier tables and the old cash_*
-- tables are only read, never changed. Old customers and bills are not touched.
-- Needs ledger_trigger.sql, ledger_non_sale.sql, credit_payments.sql, supplier_invoices.sql.

begin;

update public.chart_of_accounts set name = 'Bank' where name = 'UPI';

insert into public.chart_of_accounts (code, name, type)
select v.code, v.name, v.type
from (values
  ('1004', 'GST Input', 'Asset'),
  ('2002', 'Accounts Payable', 'Liability'),
  ('3001', 'Capital', 'Equity'),
  ('5001', 'Purchases', 'Expense'),
  ('5002', 'Expenses', 'Expense')
) as v(code, name, type)
where not exists (select 1 from public.chart_of_accounts c where c.name = v.name);

alter table public.transactions add column if not exists reference_key text;
create index if not exists transactions_reference_key_idx
  on public.transactions (reference_table, reference_key);

alter table public.customers add column if not exists remarks text;
alter table public.customers add column if not exists gstin text;

-- Bills need a saved customer; this one is for customers who give no details
insert into public.customers (name)
select 'Walk-in'
where not exists (select 1 from public.customers where lower(btrim(name)) = 'walk-in');

-- Sales: UPI now lands in Bank
create or replace function public.write_invoice_ledger(bill public.invoices)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  txn_id bigint;
  gst_rate constant numeric := 0.05;
  non_sale numeric := bill_non_sale_amount(to_jsonb(bill) -> 'products');
  sale numeric := coalesce(bill.total, 0) - non_sale;
  gst numeric := round(sale - sale / (1 + gst_rate), 2);
begin
  insert into transactions (date, description, reference_id, reference_table)
    values (bill.date, 'Sale to ' || coalesce(nullif(btrim(bill."customerName"), ''), 'Unknown'), bill.id, 'invoices')
    returning id into txn_id;

  insert into transaction_lines (transaction_id, account_id, debit, credit)
  select txn_id, c.id, greatest(v.amount, 0), greatest(-v.amount, 0)
  from (values
    ('Cash', coalesce(bill.cash, 0)::numeric),
    ('Bank', coalesce(bill.upi, 0)::numeric),
    ('Accounts Receivable', coalesce(bill.credit, 0)::numeric - non_sale),
    ('Sales Revenue', -(sale - gst)),
    ('GST Output', -gst)
  ) as v(account, amount)
  join chart_of_accounts c on c.name = v.account
  where v.amount <> 0;
end;
$$;

revoke all on function public.write_invoice_ledger(public.invoices) from public, anon, authenticated;

-- Helper: one entry from (account, amount) pairs; amount > 0 debit, < 0 credit
create or replace function public._post_entry(
  p_date timestamptz, p_description text, p_table text, p_key text, p_lines jsonb
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  txn_id bigint;
begin
  insert into transactions (date, description, reference_table, reference_key)
    values (p_date, p_description, p_table, p_key)
    returning id into txn_id;

  insert into transaction_lines (transaction_id, account_id, debit, credit)
  select txn_id, c.id, greatest(round((l->>'amount')::numeric, 2), 0), greatest(-round((l->>'amount')::numeric, 2), 0)
  from jsonb_array_elements(p_lines) l
  join chart_of_accounts c on c.name = l->>'account'
  where round((l->>'amount')::numeric, 2) <> 0;

  return txn_id;
end;
$$;

revoke all on function public._post_entry(timestamptz, text, text, text, jsonb) from public, anon, authenticated;

-- Customer payments: cash or UPI in, receivable down
create or replace function public.write_credit_payment_ledger(p public.credit_payments)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform _post_entry(
    p.paid_on::timestamptz, 'Payment from ' || p.customer_name, 'credit_payments', p.id::text,
    jsonb_build_array(
      jsonb_build_object('account', case when p.method = 'upi' then 'Bank' else 'Cash' end, 'amount', p.amount),
      jsonb_build_object('account', 'Accounts Receivable', 'amount', -p.amount)
    )
  );
end;
$$;

create or replace function public.sync_credit_payment_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    delete from transactions where reference_table = 'credit_payments' and reference_key = old.id::text;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  perform write_credit_payment_ledger(new);
  return new;
end;
$$;

revoke all on function public.write_credit_payment_ledger(public.credit_payments) from public, anon, authenticated;

drop trigger if exists tr_credit_payments_ledger on public.credit_payments;
create trigger tr_credit_payments_ledger
  after insert or update or delete on public.credit_payments
  for each row execute function public.sync_credit_payment_ledger();

-- Supplier bills: purchases and input GST in, payable up
create or replace function public.write_supplier_bill_ledger(b public.supplier_bills)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  supplier text := coalesce((select s.name from public.suppliers s where s.id::text = b.supplier_id limit 1), 'supplier');
begin
  perform _post_entry(
    b.bill_date::timestamptz, 'Purchase from ' || supplier || ' (' || b.bill_no || ')', 'supplier_bills', b.id::text,
    jsonb_build_array(
      jsonb_build_object('account', 'Purchases', 'amount', b.total - coalesce(b.gst_amount, 0)),
      jsonb_build_object('account', 'GST Input', 'amount', coalesce(b.gst_amount, 0)),
      jsonb_build_object('account', 'Accounts Payable', 'amount', -b.total)
    )
  );
end;
$$;

create or replace function public.sync_supplier_bill_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    delete from transactions where reference_table = 'supplier_bills' and reference_key = old.id::text;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  perform write_supplier_bill_ledger(new);
  return new;
end;
$$;

revoke all on function public.write_supplier_bill_ledger(public.supplier_bills) from public, anon, authenticated;

drop trigger if exists tr_supplier_bills_ledger on public.supplier_bills;
create trigger tr_supplier_bills_ledger
  after insert or update or delete on public.supplier_bills
  for each row execute function public.sync_supplier_bill_ledger();

-- Supplier payments: cash or bank out; returns and kasar reduce purchases
create or replace function public.write_supplier_payment_ledger(p public.supplier_payments)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  supplier text := coalesce((select s.name from public.suppliers s where s.id::text = p.supplier_id limit 1), 'supplier');
  other_side text := case
    when p.kind <> 'payment' then 'Purchases'
    when p.mode = 'cash' then 'Cash'
    else 'Bank'
  end;
begin
  perform _post_entry(
    p.paid_on::timestamptz,
    case p.kind when 'payment' then 'Paid ' when 'return' then 'Return to ' else 'Discount from ' end || supplier,
    'supplier_payments', p.id::text,
    jsonb_build_array(
      jsonb_build_object('account', 'Accounts Payable', 'amount', p.amount),
      jsonb_build_object('account', other_side, 'amount', -p.amount)
    )
  );
end;
$$;

create or replace function public.sync_supplier_payment_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    delete from transactions where reference_table = 'supplier_payments' and reference_key = old.id::text;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  perform write_supplier_payment_ledger(new);
  return new;
end;
$$;

revoke all on function public.write_supplier_payment_ledger(public.supplier_payments) from public, anon, authenticated;

drop trigger if exists tr_supplier_payments_ledger on public.supplier_payments;
create trigger tr_supplier_payments_ledger
  after insert or update or delete on public.supplier_payments
  for each row execute function public.sync_supplier_payment_ledger();

-- Manual entries: expenses, opening balances, bank deposits, owner money.
-- p_lines is [{"account": "Cash", "amount": 500}, {"account": "Capital", "amount": -500}];
-- positive is a debit, negative a credit, and they must add up to zero.
create or replace function public.post_journal(p_date date, p_description text, p_lines jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  total numeric;
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Not signed in';
  end if;
  select coalesce(sum(round((l->>'amount')::numeric, 2)), 0) into total from jsonb_array_elements(p_lines) l;
  if total <> 0 then
    raise exception 'Entry does not balance (off by %)', total;
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_lines) l
    where not exists (select 1 from chart_of_accounts c where c.name = l->>'account')
  ) then
    raise exception 'Unknown account';
  end if;
  return _post_entry(p_date::timestamptz, p_description, 'journal', gen_random_uuid()::text, p_lines);
end;
$$;

create or replace function public.delete_journal(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Not signed in';
  end if;
  delete from transactions where id = p_id and reference_table = 'journal';
end;
$$;

revoke all on function public.post_journal(date, text, jsonb) from public, anon;
revoke all on function public.delete_journal(bigint) from public, anon;
grant execute on function public.post_journal(date, text, jsonb) to authenticated;
grant execute on function public.delete_journal(bigint) to authenticated;

-- Existing payments and supplier records enter the books once
do $$
begin
  perform write_credit_payment_ledger(p) from credit_payments p
    where not exists (select 1 from transactions t where t.reference_table = 'credit_payments' and t.reference_key = p.id::text);
  perform write_supplier_bill_ledger(b) from supplier_bills b
    where not exists (select 1 from transactions t where t.reference_table = 'supplier_bills' and t.reference_key = b.id::text);
  perform write_supplier_payment_ledger(p) from supplier_payments p
    where not exists (select 1 from transactions t where t.reference_table = 'supplier_payments' and t.reference_key = p.id::text);
end $$;

-- Home / Shop balance: where the cash physically is. amount is signed.
create table if not exists public.balance_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  location text not null check (location in ('home', 'shop')),
  amount numeric not null,
  kind text not null check (kind in ('opening', 'in', 'out', 'transfer', 'correction')),
  transfer_id uuid,
  note text,
  author text,
  created_at timestamptz not null default now()
);

create index if not exists balance_entries_location_idx on public.balance_entries (location, entry_date);

alter table public.balance_entries enable row level security;
drop policy if exists balance_entries_rw on public.balance_entries;
create policy balance_entries_rw on public.balance_entries for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Old cashbook history carried over once
insert into public.balance_entries (entry_date, location, amount, kind, note, author, created_at)
select t.txn_date,
       lower(a.name),
       t.amount,
       case when t.type = 'correction' then 'correction' when t.amount >= 0 then 'in' else 'out' end,
       t.description,
       t.author,
       coalesce(t.created_at, now())
from public.cash_transactions t
join public.cash_accounts a on a.id = t.account_id
where lower(a.name) in ('home', 'shop')
  and not exists (select 1 from public.balance_entries);

commit;

-- To undo: restore from backup_20261013, drop the tr_* triggers created above, delete
-- ledger entries where reference_table in ('credit_payments','supplier_bills',
-- 'supplier_payments','journal'), rename "Bank" back to "UPI" and re-run
-- ledger_non_sale.sql to restore write_invoice_ledger.
