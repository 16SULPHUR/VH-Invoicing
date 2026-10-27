-- One-off: rebuilds every bill's ledger entry from the invoices table, dropping the
-- stale and duplicated entries left by the old edge function. Run ledger_trigger.sql first.
-- The ledger is derived data (every entry points at a bill), so nothing else is lost.
-- It runs in one transaction and ends by showing each account's totals before and after.
-- No bill is touched, so the Discord notification trigger does not fire.

begin;

create temporary table ledger_before on commit preserve rows as
  select c.name as account, sum(l.debit) as debit, sum(l.credit) as credit
  from transaction_lines l join chart_of_accounts c on c.id = l.account_id
  group by c.name;

delete from transactions where reference_table = 'invoices';

select public.write_invoice_ledger(i) from invoices i;

commit;

select coalesce(b.account, a.account) as account,
       b.debit as debit_before, a.debit as debit_after,
       b.credit as credit_before, a.credit as credit_after
from ledger_before b
full join (
  select c.name as account, sum(l.debit) as debit, sum(l.credit) as credit
  from transaction_lines l join chart_of_accounts c on c.id = l.account_id
  group by c.name
) a on a.account = b.account
order by 1;
