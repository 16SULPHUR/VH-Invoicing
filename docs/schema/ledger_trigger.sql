-- Keeps the accounts ledger (transactions + transaction_lines) in step with invoices
-- inside the same database transaction, replacing the tr_invoices_ledger trigger that
-- calls the generate-ledger-entry edge function over HTTP.
--
-- Why: the edge function finds a bill's ledger entry by bill number alone. Numbers
-- restart every financial year, and a renumbered bill keeps its old entry, so edits
-- and deletes leave stale entries behind (about 220 today) or duplicate them (35 bills).
-- Each bill save also waits on an HTTP call, and the function accepts unauthenticated
-- requests with the service role key.
--
-- Entries are matched on the bill's date (the invoices primary key) plus its number.

-- Writes one bill's ledger entry: cash, UPI and receivable in; sales and 5% GST out.
create or replace function public.write_invoice_ledger(bill public.invoices)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  txn_id bigint;
  gst_rate constant numeric := 0.05;
  total numeric := coalesce(bill.total, 0);
  gst numeric := round(total - total / (1 + gst_rate), 2);
begin
  insert into transactions (date, description, reference_id, reference_table)
    values (bill.date, 'Sale to ' || coalesce(nullif(btrim(bill."customerName"), ''), 'Unknown'), bill.id, 'invoices')
    returning id into txn_id;

  insert into transaction_lines (transaction_id, account_id, debit, credit)
  select txn_id, c.id, v.debit, v.credit
  from (values
    ('Cash', coalesce(bill.cash, 0)::numeric, 0::numeric),
    ('UPI', coalesce(bill.upi, 0)::numeric, 0::numeric),
    ('Accounts Receivable', coalesce(bill.credit, 0)::numeric, 0::numeric),
    ('Sales Revenue', 0::numeric, total - gst),
    ('GST Output', 0::numeric, gst)
  ) as v(account, debit, credit)
  join chart_of_accounts c on c.name = v.account
  where v.debit > 0 or v.credit > 0;
end;
$$;

create or replace function public.sync_invoice_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    delete from transactions
      where reference_table = 'invoices' and reference_id = old.id and date = old.date;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  perform write_invoice_ledger(new);
  return new;
end;
$$;

revoke all on function public.write_invoice_ledger(public.invoices) from public, anon, authenticated;

drop trigger if exists tr_invoices_ledger on public.invoices;
create trigger tr_invoices_ledger
  after insert or update or delete on public.invoices
  for each row execute function public.sync_invoice_ledger();

-- The ledger is only written by the trigger above, so the app just needs to read it.
alter table public.chart_of_accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_lines enable row level security;

drop policy if exists ledger_read on public.chart_of_accounts;
drop policy if exists ledger_read on public.transactions;
drop policy if exists ledger_read on public.transaction_lines;
create policy ledger_read on public.chart_of_accounts for select to authenticated using (true);
create policy ledger_read on public.transactions for select to authenticated using (true);
create policy ledger_read on public.transaction_lines for select to authenticated using (true);

-- After running this, delete the generate-ledger-entry edge function in the dashboard.
-- To also clean up the entries that are already wrong, run ledger_rebuild.sql.
