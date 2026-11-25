-- Saves, edits and deletes bills in one transaction each: the bill number, the
-- bill row and the stock movement either all happen or none do.
-- Stock is matched by barcode, then by an exact (case-insensitive) product name
-- when that name is unique. Lines that match nothing are returned, not guessed.
-- Until this is run the app keeps using its old step-by-step save.

-- Adds p_direction * quantity to each line's product. Returns names that did not move.
create or replace function public.apply_bill_stock(p_lines jsonb, p_direction int)
returns jsonb
language plpgsql
as $$
declare
  line jsonb;
  qty numeric;
  moved int;
  failures jsonb := '[]'::jsonb;
begin
  for line in select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    qty := coalesce(nullif(line->>'quantity', '')::numeric, 0);
    continue when qty = 0;
    moved := 0;

    if coalesce(line->>'barcode', '') <> '' then
      update public.products
        set quantity = coalesce(quantity, 0) + p_direction * qty
        where barcode::text = ltrim(line->>'barcode', '0');
      get diagnostics moved = row_count;
    end if;

    if moved = 0 and coalesce(line->>'name', '') <> '' then
      update public.products
        set quantity = coalesce(quantity, 0) + p_direction * qty
        where lower(btrim(name)) = lower(btrim(line->>'name'))
          and (select count(*) from public.products p
               where lower(btrim(p.name)) = lower(btrim(line->>'name'))) = 1;
      get diagnostics moved = row_count;
    end if;

    if moved = 0 then
      failures := failures || jsonb_build_object('name', line->>'name');
    end if;
  end loop;

  return failures;
end;
$$;

create or replace function public._bill_lines(p_products jsonb)
returns jsonb
language sql
immutable
as $$
  select case jsonb_typeof(p_products)
    when 'string' then (p_products #>> '{}')::jsonb
    when 'array' then p_products
    else '[]'::jsonb
  end;
$$;

-- Only the columns the app sends, so column defaults still apply to the rest.
create or replace function public._bill_columns(p_bill jsonb, p_skip text[] default '{}')
returns text
language sql
stable
as $$
  select string_agg(quote_ident(key), ', ')
  from jsonb_object_keys(p_bill) as key
  where key <> all (p_skip)
    and key in (
      select column_name from information_schema.columns
      where table_schema = 'public' and table_name = 'invoices'
    );
$$;

-- Creates a bill. Keeps p_bill.id when it is free in the bill's financial year,
-- otherwise takes the next number. Calling it again for the same date is a no-op,
-- so an offline sync that retries cannot save a bill twice.
create or replace function public.create_bill(p_bill jsonb)
returns jsonb
language plpgsql
as $$
declare
  bill_date timestamptz := (p_bill->>'date')::timestamptz;
  local_day date := (bill_date at time zone 'Asia/Kolkata')::date;
  fy_start_year int := extract(year from local_day)::int
    - case when extract(month from local_day) < 4 then 1 else 0 end;
  fy_start timestamptz := make_timestamptz(fy_start_year, 4, 1, 0, 0, 0, 'Asia/Kolkata');
  fy_end timestamptz := make_timestamptz(fy_start_year + 1, 4, 1, 0, 0, 0, 'Asia/Kolkata');
  wanted bigint := nullif(p_bill->>'id', '')::bigint;
  bill_id bigint;
  existing jsonb;
  saved jsonb;
  payload jsonb;
  cols text;
begin
  -- One bill number handed out at a time across every till and phone.
  perform pg_advisory_xact_lock(hashtext('vh-invoice-number'));

  select to_jsonb(i) into existing from public.invoices i
    where i.date = (jsonb_populate_record(null::public.invoices, jsonb_build_object('date', p_bill->>'date'))).date;
  if existing is not null then
    return jsonb_build_object('invoice', existing, 'stock_failures', '[]'::jsonb, 'duplicate', true);
  end if;

  if wanted is not null and not exists (
    select 1 from public.invoices
    where id = wanted and date >= fy_start and date < fy_end
  ) then
    bill_id := wanted;
  else
    select coalesce(max(id), 0) + 1 into bill_id from public.invoices
      where date >= fy_start and date < fy_end;
  end if;

  payload := p_bill || jsonb_build_object('id', bill_id);
  cols := public._bill_columns(payload);
  execute format(
    'insert into public.invoices (%1$s) select %1$s from jsonb_populate_record(null::public.invoices, $1) returning to_jsonb(invoices.*)',
    cols
  ) using payload into saved;

  return jsonb_build_object(
    'invoice', saved,
    'stock_failures', public.apply_bill_stock(public._bill_lines(p_bill->'products'), -1)
  );
end;
$$;

-- Edits a bill found by its date. Stock moves by the difference between the old and new lines.
create or replace function public.update_bill(p_date text, p_changes jsonb)
returns jsonb
language plpgsql
as $$
declare
  key_value public.invoices;
  previous jsonb;
  saved jsonb;
  cols text;
  failures jsonb := '[]'::jsonb;
begin
  key_value := jsonb_populate_record(null::public.invoices, jsonb_build_object('date', p_date));

  select to_jsonb(i) into previous from public.invoices i
    where i.date = key_value.date
    for update;
  if previous is null then
    raise exception 'Bill % not found', p_date using errcode = 'P0002';
  end if;

  cols := public._bill_columns(p_changes, array['date', 'id']);
  if cols is not null then
    execute format(
      'update public.invoices set (%1$s) = (select %1$s from jsonb_populate_record(null::public.invoices, $1)) where date = $2 returning to_jsonb(invoices.*)',
      cols
    ) using p_changes, key_value.date into saved;
  else
    saved := previous;
  end if;

  if p_changes ? 'products' then
    failures := public.apply_bill_stock(public._bill_lines(previous->'products'), 1)
      || public.apply_bill_stock(public._bill_lines(p_changes->'products'), -1);
  end if;

  return jsonb_build_object('invoice', saved, 'stock_failures', failures);
end;
$$;

-- Deletes a bill and puts its stock back.
create or replace function public.delete_bill(p_date text)
returns jsonb
language plpgsql
as $$
declare
  key_value public.invoices;
  removed jsonb;
begin
  key_value := jsonb_populate_record(null::public.invoices, jsonb_build_object('date', p_date));

  delete from public.invoices i where i.date = key_value.date returning to_jsonb(i) into removed;
  if removed is null then
    return jsonb_build_object('invoice', null, 'stock_failures', '[]'::jsonb);
  end if;

  return jsonb_build_object(
    'invoice', removed,
    'stock_failures', public.apply_bill_stock(public._bill_lines(removed->'products'), 1)
  );
end;
$$;

revoke all on function public.apply_bill_stock(jsonb, int) from public, anon;
revoke all on function public.create_bill(jsonb) from public, anon;
revoke all on function public.update_bill(text, jsonb) from public, anon;
revoke all on function public.delete_bill(text) from public, anon;
grant execute on function public.apply_bill_stock(jsonb, int) to authenticated;
grant execute on function public.create_bill(jsonb) to authenticated;
grant execute on function public.update_bill(text, jsonb) to authenticated;
grant execute on function public.delete_bill(text) to authenticated;
