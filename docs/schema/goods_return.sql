-- Goods return: send back some or all items of a bill.
--
-- A return is a credit note (public.credit_notes, the same one the Counter's "Take back"
-- issues and the GSTR-1 credit note section reads) linked to the bill by its number and
-- date. The bill itself is not changed except that a "reduce due" refund lowers its credit.
-- vh_return_goods checks the quantities, saves the note, puts restocked pieces back and
-- lowers the due in one transaction.
--
-- Books: the note posts Dr Sales Revenue + GST Output, Cr Cash / Bank / Accounts Receivable /
-- Customer Credits (new liability: store credit the shop owes). Using a store credit on a
-- later bill posts Dr Customer Credits, Cr Cash, which cancels the cash the till counted for it.
--
-- BEFORE RUNNING, snapshot what this touches:
--   create schema if not exists backup_20261121;
--   create table backup_20261121.chart_of_accounts as table public.chart_of_accounts;
--   create table backup_20261121.credit_notes as table public.credit_notes;
--   create table backup_20261121.transactions as table public.transactions;
--   create table backup_20261121.transaction_lines as table public.transaction_lines;
--   create table backup_20261121.function_defs as
--     select p.proname, pg_get_functiondef(p.oid) as definition
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--     where n.nspname = 'public' and p.proname = 'write_invoice_ledger';
--
-- Needs shop_tools.sql, books.sql and ledger_non_sale.sql. Safe to run more than once.
-- There are no credit notes yet, so no existing ledger entries change.

begin;

alter table public.credit_notes
  add column if not exists source_invoice_date timestamptz,
  add column if not exists refund_cash bigint not null default 0,
  add column if not exists refund_upi bigint not null default 0,
  add column if not exists refund_due bigint not null default 0,
  add column if not exists refunded_by text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'credit_notes_refunds_valid') then
    alter table public.credit_notes add constraint credit_notes_refunds_valid check (
      refund_cash >= 0 and refund_upi >= 0 and refund_due >= 0
      and redeemed + refund_cash + refund_upi + refund_due <= amount
    );
  end if;
end $$;

create index if not exists credit_notes_source_idx on public.credit_notes (source_bill, source_invoice_date);

insert into public.chart_of_accounts (code, name, type)
select '2003', 'Customer Credits', 'Liability'
where not exists (select 1 from public.chart_of_accounts where name = 'Customer Credits');

-- Credit already taken off a bill's due by returns
create or replace function public.bill_returned_due(p_id bigint, p_date timestamptz)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(refund_due), 0)
  from public.credit_notes
  where source_bill = p_id and source_invoice_date = p_date and status <> 'void';
$$;

revoke all on function public.bill_returned_due(bigint, timestamptz) from public, anon;
grant execute on function public.bill_returned_due(bigint, timestamptz) to authenticated;

-- A bill's entry: what the customer owed at billing is the current credit plus what returns took off it
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
  returned_due numeric := bill_returned_due(bill.id, bill.date);
begin
  insert into transactions (date, description, reference_id, reference_table)
    values (bill.date, 'Sale to ' || coalesce(nullif(btrim(bill."customerName"), ''), 'Unknown'), bill.id, 'invoices')
    returning id into txn_id;

  insert into transaction_lines (transaction_id, account_id, debit, credit)
  select txn_id, c.id, greatest(v.amount, 0), greatest(-v.amount, 0)
  from (values
    ('Cash', coalesce(bill.cash, 0)::numeric),
    ('Bank', coalesce(bill.upi, 0)::numeric),
    ('Accounts Receivable', coalesce(bill.credit, 0)::numeric + returned_due - non_sale),
    ('Sales Revenue', -(sale - gst)),
    ('GST Output', -gst)
  ) as v(account, amount)
  join chart_of_accounts c on c.name = v.account
  where v.amount <> 0;
end;
$$;

revoke all on function public.write_invoice_ledger(public.invoices) from public, anon, authenticated;

-- A credit note's entries: the return itself, then one for each time it was used on a bill
create or replace function public.write_credit_note_ledger(n public.credit_notes)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  gst numeric := round(n.amount - n.amount / 1.05, 2);
  store numeric := n.amount - n.refund_cash - n.refund_upi - n.refund_due;
  use_row jsonb;
begin
  perform _post_entry(
    n.created_at,
    'Return from ' || coalesce(nullif(btrim(n.customer_name), ''), 'customer') || ' (' || n.token || ')',
    'credit_notes', n.id::text,
    jsonb_build_array(
      jsonb_build_object('account', 'Sales Revenue', 'amount', n.amount - gst),
      jsonb_build_object('account', 'GST Output', 'amount', gst),
      jsonb_build_object('account', 'Cash', 'amount', -n.refund_cash),
      jsonb_build_object('account', 'Bank', 'amount', -n.refund_upi),
      jsonb_build_object('account', 'Accounts Receivable', 'amount', -n.refund_due),
      jsonb_build_object('account', 'Customer Credits', 'amount', -store)
    )
  );

  for use_row in select value from jsonb_array_elements(coalesce(n.redemptions, '[]'::jsonb)) loop
    perform _post_entry(
      coalesce((use_row ->> 'at')::timestamptz, n.created_at),
      'Credit note ' || n.token || ' used on bill ' || coalesce(use_row ->> 'bill_no', ''),
      'credit_notes', n.id::text,
      jsonb_build_array(
        jsonb_build_object('account', 'Customer Credits', 'amount', (use_row ->> 'amount')::numeric),
        jsonb_build_object('account', 'Cash', 'amount', -(use_row ->> 'amount')::numeric)
      )
    );
  end loop;
end;
$$;

create or replace function public.sync_credit_note_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    delete from transactions where reference_table = 'credit_notes' and reference_key = old.id::text;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  if new.status <> 'void' then
    perform write_credit_note_ledger(new);
  end if;
  return new;
end;
$$;

revoke all on function public.write_credit_note_ledger(public.credit_notes) from public, anon, authenticated;

drop trigger if exists tr_credit_notes_ledger on public.credit_notes;
create trigger tr_credit_notes_ledger
  after insert or update or delete on public.credit_notes
  for each row execute function public.sync_credit_note_ledger();

-- A bill with returns keeps its goods and total; deleting or re-pricing it would orphan the notes
create or replace function public.guard_returned_invoice()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.products::text is not distinct from old.products::text
     and new.total is not distinct from old.total then
    return new;
  end if;

  if exists (
    select 1 from public.credit_notes
    where source_bill = old.id and source_invoice_date = old.date and status <> 'void'
  ) then
    raise exception 'Bill % has returns, so its items and total can no longer change. Void the return notes first.', old.id
      using errcode = 'P0001';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_invoices_guard_returns on public.invoices;
create trigger tr_invoices_guard_returns
  before update or delete on public.invoices
  for each row execute function public.guard_returned_invoice();

-- p_lines: [{ "index": 0, "quantity": 1, "restock": true }], index is the position of the line on the bill (from 0).
-- Prices come from the bill (what the customer actually paid), never from the caller.
-- Refunds: cash, UPI and due are taken off the amount; whatever is left becomes store credit.
create or replace function public.vh_return_goods(
  p_invoice_date timestamptz,
  p_lines jsonb,
  p_cash bigint default 0,
  p_upi bigint default 0,
  p_due bigint default 0,
  p_expires_on date default null,
  p_note text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  inv public.invoices;
  bill_lines jsonb;
  picked jsonb;
  src jsonb;
  idx int;
  qty numeric;
  sold numeric;
  already numeric;
  line_amount numeric;
  unit numeric;
  pid text;
  moved int;
  total_amount bigint := 0;
  store bigint;
  out_lines jsonb := '[]'::jsonb;
  failures jsonb := '[]'::jsonb;
  saved public.credit_notes;
  updated jsonb;
  author text := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email';
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Not signed in';
  end if;

  select * into inv from public.invoices where date = p_invoice_date for update;
  if not found then
    raise exception 'Bill not found' using errcode = 'P0002';
  end if;

  bill_lines := public._bill_lines(public._bill_lines(to_jsonb(inv) -> 'products'));

  for picked in select value from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    idx := (picked ->> 'index')::int;
    qty := coalesce((picked ->> 'quantity')::numeric, 0);
    continue when qty <= 0;

    src := bill_lines -> idx;
    if src is null then
      raise exception 'Line % is not on bill %', idx + 1, inv.id;
    end if;

    sold := coalesce(nullif(src ->> 'quantity', '')::numeric, 1);
    line_amount := coalesce(nullif(src ->> 'amount', '')::numeric, coalesce(nullif(src ->> 'price', '')::numeric, 0) * sold);

    if sold <= 0 or line_amount <= 0
       or exists (select 1 from public.non_sale_line_patterns p where btrim(src ->> 'name') ~* p.pattern) then
      raise exception '"%" is not goods that can be returned', src ->> 'name';
    end if;

    select coalesce(sum((l ->> 'quantity')::numeric), 0) into already
    from public.credit_notes n, jsonb_array_elements(n.lines) l
    where n.source_bill = inv.id and n.source_invoice_date = inv.date and n.status <> 'void'
      and (l ->> 'bill_line')::int = idx;

    if qty + already > sold then
      raise exception 'Only % of "%" can still be returned', sold - already, src ->> 'name';
    end if;

    unit := line_amount / sold;
    pid := null;
    if coalesce(src ->> 'barcode', '') <> '' then
      select id::text into pid from public.products where barcode::text = ltrim(src ->> 'barcode', '0') limit 1;
    end if;
    if pid is null and coalesce(src ->> 'name', '') <> '' then
      select (array_agg(id::text))[1] into pid from public.products
        where lower(btrim(name)) = lower(btrim(src ->> 'name')) having count(*) = 1;
    end if;

    total_amount := total_amount + round(unit * qty);
    out_lines := out_lines || jsonb_build_object(
      'key', gen_random_uuid()::text,
      'bill_line', idx,
      'product_id', pid,
      'barcode', nullif(src ->> 'barcode', ''),
      'name', src ->> 'name',
      'price', round(unit, 2),
      'quantity', qty,
      'restock', coalesce((picked ->> 'restock')::boolean, true)
    );
  end loop;

  if total_amount <= 0 then
    raise exception 'Pick at least one item to return';
  end if;
  if p_cash < 0 or p_upi < 0 or p_due < 0 then
    raise exception 'Refund amounts cannot be negative';
  end if;
  if p_due > coalesce(inv.credit, 0) then
    raise exception 'Only % is still due on this bill', coalesce(inv.credit, 0);
  end if;
  store := total_amount - p_cash - p_upi - p_due;
  if store < 0 then
    raise exception 'Refunds add up to more than the returned goods (%)', total_amount;
  end if;

  insert into public.credit_notes (
    customer_name, customer_phone, amount, expires_on, source_bill, source_invoice_date,
    lines, note, status, refund_cash, refund_upi, refund_due, refunded_by
  ) values (
    coalesce(inv."customerName", ''), nullif(btrim(inv."customerNumber"), ''), total_amount,
    case when store > 0 then p_expires_on end, inv.id, inv.date,
    out_lines, nullif(btrim(p_note), ''), case when store > 0 then 'open' else 'used' end,
    p_cash, p_upi, p_due, author
  ) returning * into saved;

  for picked in select value from jsonb_array_elements(out_lines) loop
    continue when not (picked ->> 'restock')::boolean;
    if picked ->> 'product_id' is null then
      failures := failures || jsonb_build_object('name', picked ->> 'name');
      continue;
    end if;
    update public.products
      set quantity = coalesce(quantity, 0) + round((picked ->> 'quantity')::numeric)
      where id::text = picked ->> 'product_id';
    get diagnostics moved = row_count;
    if moved = 0 then
      failures := failures || jsonb_build_object('name', picked ->> 'name');
      continue;
    end if;
    insert into public.stock_moves (product_id, name, delta, reason, ref, author)
      values (picked ->> 'product_id', picked ->> 'name', round((picked ->> 'quantity')::numeric)::int, 'bill_return', saved.token, author);
  end loop;

  if p_due > 0 then
    update public.invoices set credit = coalesce(credit, 0) - p_due where date = inv.date returning to_jsonb(invoices.*) into updated;
  else
    updated := to_jsonb(inv);
  end if;

  return jsonb_build_object('note', to_jsonb(saved), 'invoice', updated, 'stock_failures', failures);
end;
$$;

revoke all on function public.vh_return_goods(timestamptz, jsonb, bigint, bigint, bigint, date, text) from public, anon;
grant execute on function public.vh_return_goods(timestamptz, jsonb, bigint, bigint, bigint, date, text) to authenticated;

notify pgrst, 'reload schema';

commit;

-- To undo: restore credit_notes and the ledger tables from backup_20261121, drop the triggers
-- tr_credit_notes_ledger and tr_invoices_guard_returns and the functions vh_return_goods,
-- write_credit_note_ledger, sync_credit_note_ledger, guard_returned_invoice, bill_returned_due,
-- delete the Customer Credits account, and restore write_invoice_ledger from backup_20261121.function_defs
-- (or re-run books.sql's version).
