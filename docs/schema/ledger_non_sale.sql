-- Fixes two ledger problems, then rebuilds every bill's entry:
-- 1. Non-sale bill lines (JAMA, OLD CREDIT, CREDIT, ADVANCE) were booked as sales with GST.
--    They now go to Accounts Receivable instead: a positive line moves old dues onto this
--    bill, a negative one uses up money the customer paid earlier.
-- 2. Negative amounts (returns, refunds) were dropped, leaving entries that don't balance.
--    They now go on the opposite side.
-- The non-sale list lives in non_sale_line_patterns (case-insensitive regex on the line
-- name), shared with the Reports GST screen. Editing it affects new entries; re-run the
-- rebuild block at the end to apply it to old bills.
-- Needs ledger_trigger.sql and save_bill_function.sql (for _bill_lines) to have been run.

begin;

create table if not exists public.backup_20260929_transactions as table public.transactions;
create table if not exists public.backup_20260929_transaction_lines as table public.transaction_lines;
alter table public.backup_20260929_transactions enable row level security;
alter table public.backup_20260929_transaction_lines enable row level security;

create table if not exists public.non_sale_line_patterns (
  pattern text primary key,
  note text
);

insert into public.non_sale_line_patterns (pattern, note) values
  ('^(CASH )?JAMA', 'Money the customer paid earlier, used on this bill'),
  ('OLD CREDIT', 'Old dues moved onto this bill'),
  ('^CREDIT( [0-9/.-]+)?$', 'Old dues moved onto or off this bill (CREDIT or CREDIT 05/12/2024)'),
  ('^UPDATED CREDIT', 'Old dues moved onto this bill'),
  ('\yADVANCE$', 'Advance taken, not a sale yet')
on conflict (pattern) do nothing;

alter table public.non_sale_line_patterns enable row level security;
drop policy if exists non_sale_rw on public.non_sale_line_patterns;
create policy non_sale_rw on public.non_sale_line_patterns
  for all to authenticated using (true) with check (true);

create or replace function public.bill_non_sale_amount(p_products jsonb)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(coalesce(
    nullif(l->>'amount', '')::numeric,
    coalesce(nullif(l->>'price', '')::numeric, 0) * coalesce(nullif(l->>'quantity', '')::numeric, 0)
  )), 0)
  from jsonb_array_elements(_bill_lines(_bill_lines(p_products))) l
  where exists (select 1 from non_sale_line_patterns p where btrim(l->>'name') ~* p.pattern);
$$;

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

  -- amount > 0 is a debit, < 0 a credit
  insert into transaction_lines (transaction_id, account_id, debit, credit)
  select txn_id, c.id, greatest(v.amount, 0), greatest(-v.amount, 0)
  from (values
    ('Cash', coalesce(bill.cash, 0)::numeric),
    ('UPI', coalesce(bill.upi, 0)::numeric),
    ('Accounts Receivable', coalesce(bill.credit, 0)::numeric - non_sale),
    ('Sales Revenue', -(sale - gst)),
    ('GST Output', -gst)
  ) as v(account, amount)
  join chart_of_accounts c on c.name = v.account
  where v.amount <> 0;
end;
$$;

revoke all on function public.write_invoice_ledger(public.invoices) from public, anon, authenticated;
revoke all on function public.bill_non_sale_amount(jsonb) from public, anon;
grant execute on function public.bill_non_sale_amount(jsonb) to authenticated;

-- Rebuild
delete from transactions where reference_table = 'invoices';
do $$ begin perform public.write_invoice_ledger(i) from public.invoices i; end $$;

commit;

-- Totals per account: before (backup) and after
select coalesce(b.account, a.account) as account,
       b.debit - b.credit as net_before, a.debit - a.credit as net_after
from (
  select c.name as account, sum(l.debit) as debit, sum(l.credit) as credit
  from backup_20260929_transaction_lines l join chart_of_accounts c on c.id = l.account_id
  group by c.name
) b
full join (
  select c.name as account, sum(l.debit) as debit, sum(l.credit) as credit
  from transaction_lines l join chart_of_accounts c on c.id = l.account_id
  group by c.name
) a on a.account = b.account
order by 1;

-- To undo:
-- begin;
-- delete from transactions where reference_table = 'invoices';
-- insert into transactions select * from backup_20260929_transactions where reference_table = 'invoices';
-- insert into transaction_lines select l.* from backup_20260929_transaction_lines l
--   join backup_20260929_transactions t on t.id = l.transaction_id where t.reference_table = 'invoices';
-- commit;
-- (and re-run ledger_trigger.sql to restore the previous write_invoice_ledger)
