-- Edit and delete a return (credit note made from a bill). Needs goods_return.sql.
--
-- vh_cancel_return: the return is cancelled. Restocked pieces come back out of stock, the due it
-- took off the bill is put back, and its books entries go (the ledger trigger removes them when
-- the note is voided). The credit note number stays in the series as cancelled. Refused when store
-- credit from the note has already been used on a bill.
--
-- vh_edit_return: changes how the return was refunded (cash, UPI, off the due, store credit),
-- its valid till date and the reason. Items stay as they were: to change them, cancel and redo.
--
-- No tables change, so no snapshot is needed beyond the one taken for goods_return.sql.
-- Safe to run more than once.

begin;

create or replace function public.vh_cancel_return(p_note_id uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  n public.credit_notes;
  saved public.credit_notes;
  inv public.invoices;
  picked jsonb;
  moved int;
  updated jsonb;
  failures jsonb := '[]'::jsonb;
  author text := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email';
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Not signed in';
  end if;

  select * into n from public.credit_notes where id = p_note_id for update;
  if not found then
    raise exception 'Credit note not found' using errcode = 'P0002';
  end if;
  if n.source_invoice_date is null then
    raise exception '% was not made from a bill. Void it from the Counter instead.', n.token;
  end if;
  if n.status = 'void' then
    raise exception '% is already deleted', n.token;
  end if;
  if n.redeemed > 0 then
    raise exception 'Store credit of % from % was already used on a bill, so it cannot be deleted', n.redeemed, n.token;
  end if;

  select * into inv from public.invoices where date = n.source_invoice_date for update;

  update public.credit_notes
    set status = 'void', version = version + 1, updated_at = now()
    where id = n.id
    returning * into saved;

  for picked in select value from jsonb_array_elements(n.lines) loop
    continue when not coalesce((picked ->> 'restock')::boolean, true);
    continue when picked ->> 'product_id' is null;
    update public.products
      set quantity = coalesce(quantity, 0) - round((picked ->> 'quantity')::numeric)
      where id::text = picked ->> 'product_id';
    get diagnostics moved = row_count;
    if moved = 0 then
      failures := failures || jsonb_build_object('name', picked ->> 'name');
      continue;
    end if;
    insert into public.stock_moves (product_id, name, delta, reason, ref, author)
      values (picked ->> 'product_id', picked ->> 'name', -round((picked ->> 'quantity')::numeric)::int, 'bill_return_cancel', n.token, author);
  end loop;

  if inv.date is not null and n.refund_due > 0 then
    update public.invoices set credit = coalesce(credit, 0) + n.refund_due where date = inv.date returning to_jsonb(invoices.*) into updated;
  else
    updated := to_jsonb(inv);
  end if;

  return jsonb_build_object('note', to_jsonb(saved), 'invoice', updated, 'stock_failures', failures);
end;
$$;

create or replace function public.vh_edit_return(
  p_note_id uuid,
  p_cash bigint,
  p_upi bigint,
  p_due bigint,
  p_expires_on date default null,
  p_note text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  n public.credit_notes;
  saved public.credit_notes;
  inv public.invoices;
  store bigint;
  updated jsonb;
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Not signed in';
  end if;

  select * into n from public.credit_notes where id = p_note_id for update;
  if not found then
    raise exception 'Credit note not found' using errcode = 'P0002';
  end if;
  if n.source_invoice_date is null then
    raise exception '% was not made from a bill', n.token;
  end if;
  if n.status = 'void' then
    raise exception '% is deleted and cannot be edited', n.token;
  end if;

  select * into inv from public.invoices where date = n.source_invoice_date for update;
  if not found then
    raise exception 'The bill for % no longer exists', n.token;
  end if;

  if p_cash < 0 or p_upi < 0 or p_due < 0 then
    raise exception 'Refund amounts cannot be negative';
  end if;
  store := n.amount - p_cash - p_upi - p_due;
  if store < 0 then
    raise exception 'Refunds add up to more than the returned goods (%)', n.amount;
  end if;
  if n.redeemed > store then
    raise exception 'Store credit of % was already used, so at least that much must stay as store credit', n.redeemed;
  end if;
  if p_due > coalesce(inv.credit, 0) + n.refund_due then
    raise exception 'Only % can come off this bill''s due', coalesce(inv.credit, 0) + n.refund_due;
  end if;

  update public.credit_notes set
    refund_cash = p_cash,
    refund_upi = p_upi,
    refund_due = p_due,
    expires_on = case when store > 0 then p_expires_on end,
    note = nullif(btrim(p_note), ''),
    status = case when store - n.redeemed > 0 then 'open' else 'used' end,
    version = version + 1,
    updated_at = now()
  where id = n.id
  returning * into saved;

  if p_due <> n.refund_due then
    update public.invoices set credit = coalesce(credit, 0) + n.refund_due - p_due where date = inv.date returning to_jsonb(invoices.*) into updated;
  else
    updated := to_jsonb(inv);
  end if;

  return jsonb_build_object('note', to_jsonb(saved), 'invoice', updated);
end;
$$;

revoke all on function public.vh_cancel_return(uuid) from public, anon;
revoke all on function public.vh_edit_return(uuid, bigint, bigint, bigint, date, text) from public, anon;
grant execute on function public.vh_cancel_return(uuid) to authenticated;
grant execute on function public.vh_edit_return(uuid, bigint, bigint, bigint, date, text) to authenticated;

notify pgrst, 'reload schema';

commit;
