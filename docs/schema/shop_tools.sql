-- Shop tools: alterations, goods on approval (jangad), advance bookings, exchanges with
-- credit notes, and stock counts. Safe to run more than once. Until it is run these
-- screens say so and stay switched off; nothing else in the app depends on them.
--
-- Stock only moves through vh_tool_save, which saves the record and changes
-- products.quantity in one transaction and writes each change to stock_moves.

-- Short tokens for slips and QR codes: A101 (alteration), J101 (jangad), B101 (booking),
-- CN101 (credit note), SC101 (stock count).
create sequence if not exists public.service_jobs_token_seq start 101;
create sequence if not exists public.approvals_token_seq start 101;
create sequence if not exists public.bookings_token_seq start 101;
create sequence if not exists public.credit_notes_token_seq start 101;
create sequence if not exists public.stock_counts_token_seq start 101;

-- Alterations and stitching. Money in whole rupees; paid is what was collected at delivery.
create table if not exists public.service_jobs (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default ('A' || nextval('public.service_jobs_token_seq')),
  kind text not null default 'alteration' check (kind in ('fall_pico', 'blouse', 'alteration', 'other')),
  customer_name text not null default '',
  customer_phone text,
  items text not null default '',
  measurements text,
  charge bigint not null default 0 check (charge >= 0),
  advance bigint not null default 0 check (advance >= 0),
  paid bigint not null default 0 check (paid >= 0),
  ready_on date,
  status text not null default 'received' check (status in ('received', 'with_tailor', 'ready', 'delivered')),
  tailor text,
  notified_at timestamp with time zone,
  delivered_at timestamp with time zone,
  version integer not null default 1,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists service_jobs_status_idx on public.service_jobs (status, ready_on);

-- Goods on approval. lines: [{ key, product_id, barcode, name, price, quantity, returned, sold, till_at, bill_no }].
-- Pieces leave stock when issued, come back when returned, and sold pieces are handed
-- to the till, which takes them out of stock again when the bill is saved.
create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default ('J' || nextval('public.approvals_token_seq')),
  customer_name text not null default '',
  customer_phone text,
  due_on date,
  status text not null default 'open' check (status in ('open', 'closed')),
  lines jsonb not null default '[]'::jsonb,
  note text,
  notified_at timestamp with time zone,
  closed_at timestamp with time zone,
  version integer not null default 1,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists approvals_status_idx on public.approvals (status, due_on);

-- Advance bookings and custom orders. lines: [{ key, product_id?, barcode?, name, price, quantity }];
-- lines with a product_id are held out of stock until pickup or cancellation.
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default ('B' || nextval('public.bookings_token_seq')),
  customer_name text not null default '',
  customer_phone text,
  lines jsonb not null default '[]'::jsonb,
  total bigint not null default 0 check (total >= 0),
  advance bigint not null default 0 check (advance >= 0),
  pickup_on date,
  status text not null default 'booked' check (status in ('booked', 'ready', 'picked_up', 'cancelled')),
  note text,
  bill_no bigint,
  till_at timestamp with time zone,
  notified_at timestamp with time zone,
  version integer not null default 1,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists bookings_status_idx on public.bookings (status, pickup_on);

-- Credit notes from exchanges. lines are the pieces taken back into stock.
-- redemptions: [{ bill_no, amount, at }]; redeemed is their sum.
create table if not exists public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default ('CN' || nextval('public.credit_notes_token_seq')),
  customer_name text not null default '',
  customer_phone text,
  amount bigint not null check (amount > 0),
  redeemed bigint not null default 0 check (redeemed >= 0),
  expires_on date,
  source_bill bigint,
  lines jsonb not null default '[]'::jsonb,
  redemptions jsonb not null default '[]'::jsonb,
  note text,
  status text not null default 'open' check (status in ('open', 'used', 'void')),
  version integer not null default 1,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint credit_notes_redeemed_within_amount check (redeemed <= amount)
);

-- Stock counts. scope: all, supplier (supplier holds the supplier id) or negative.
-- result: the quantities changed when the count was applied.
create table if not exists public.stock_counts (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default ('SC' || nextval('public.stock_counts_token_seq')),
  scope text not null default 'all' check (scope in ('all', 'supplier', 'negative')),
  supplier text,
  status text not null default 'counting' check (status in ('counting', 'applied', 'closed')),
  result jsonb,
  note text,
  applied_at timestamp with time zone,
  version integer not null default 1,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- One row per scan, so several phones can count at once without overwriting each other.
create table if not exists public.stock_count_scans (
  id uuid primary key default gen_random_uuid(),
  count_id uuid not null references public.stock_counts (id) on delete cascade,
  code text not null,
  product_id text,
  quantity integer not null default 1,
  created_at timestamp with time zone not null default now()
);

create index if not exists stock_count_scans_count_idx on public.stock_count_scans (count_id, created_at desc);

-- Every stock change made by these tools.
create table if not exists public.stock_moves (
  id uuid primary key default gen_random_uuid(),
  product_id text,
  name text,
  delta integer not null,
  reason text not null,
  ref text,
  author text,
  created_at timestamp with time zone not null default now()
);

create index if not exists stock_moves_product_idx on public.stock_moves (product_id, created_at desc);
create index if not exists stock_moves_ref_idx on public.stock_moves (ref);

alter table public.service_jobs enable row level security;
alter table public.approvals enable row level security;
alter table public.bookings enable row level security;
alter table public.credit_notes enable row level security;
alter table public.stock_counts enable row level security;
alter table public.stock_count_scans enable row level security;
alter table public.stock_moves enable row level security;

drop policy if exists service_jobs_rw on public.service_jobs;
create policy service_jobs_rw on public.service_jobs for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists approvals_rw on public.approvals;
create policy approvals_rw on public.approvals for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists bookings_rw on public.bookings;
create policy bookings_rw on public.bookings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists credit_notes_rw on public.credit_notes;
create policy credit_notes_rw on public.credit_notes for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists stock_counts_rw on public.stock_counts;
create policy stock_counts_rw on public.stock_counts for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists stock_count_scans_rw on public.stock_count_scans;
create policy stock_count_scans_rw on public.stock_count_scans for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists stock_moves_rw on public.stock_moves;
create policy stock_moves_rw on public.stock_moves for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

revoke all on public.service_jobs, public.approvals, public.bookings, public.credit_notes,
  public.stock_counts, public.stock_count_scans, public.stock_moves from anon;
grant select, insert, update, delete on public.service_jobs, public.approvals, public.bookings, public.credit_notes,
  public.stock_counts, public.stock_count_scans, public.stock_moves to authenticated;

grant usage on sequence public.service_jobs_token_seq, public.approvals_token_seq, public.bookings_token_seq,
  public.credit_notes_token_seq, public.stock_counts_token_seq to authenticated;

-- Saves one record of a shop tools table and applies its stock changes together.
-- p_id null inserts; otherwise the row is updated only if it is still at p_version, so two
-- phones cannot settle the same thing twice (error 40001 means reload and try again).
-- p_row holds the columns to write; id, token, version and timestamps are never taken from it.
-- p_moves: [{ product_id, name, delta, reason? }]. Runs as the caller, so the usual RLS applies.
create or replace function public.vh_tool_save(
  p_table text,
  p_id uuid,
  p_version integer,
  p_row jsonb,
  p_moves jsonb default '[]'::jsonb,
  p_reason text default null
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_cols text;
  v_saved jsonb;
  v_move jsonb;
  v_delta integer;
  v_author text := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email';
begin
  if p_table not in ('service_jobs', 'approvals', 'bookings', 'credit_notes', 'stock_counts') then
    raise exception 'vh_tool_save: % is not a shop tools table', p_table;
  end if;

  select string_agg(quote_ident(a.attname), ', ' order by a.attnum) into v_cols
  from pg_catalog.pg_attribute a
  where a.attrelid = ('public.' || quote_ident(p_table))::regclass
    and a.attnum > 0
    and not a.attisdropped
    and a.attname not in ('id', 'token', 'version', 'created_at', 'updated_at')
    and coalesce(p_row, '{}'::jsonb) ? a.attname;

  if p_id is null then
    if v_cols is null then
      raise exception 'vh_tool_save: nothing to save';
    end if;
    execute format(
      'insert into public.%1$I as t (%2$s) select %2$s from jsonb_populate_record(null::public.%1$I, $1) returning to_jsonb(t)',
      p_table, v_cols
    ) into v_saved using p_row;
  elsif v_cols is null then
    execute format(
      'update public.%1$I t set version = t.version + 1, updated_at = now() where t.id = $1 and t.version = $2 returning to_jsonb(t)',
      p_table
    ) into v_saved using p_id, p_version;
  else
    execute format(
      'update public.%1$I t set (%2$s) = (select %2$s from jsonb_populate_record(null::public.%1$I, $3)), '
      'version = t.version + 1, updated_at = now() where t.id = $1 and t.version = $2 returning to_jsonb(t)',
      p_table, v_cols
    ) into v_saved using p_id, p_version, p_row;
  end if;

  if v_saved is null then
    raise exception using
      errcode = '40001',
      message = 'This was changed on another device. Reload and try again.';
  end if;

  for v_move in select value from jsonb_array_elements(coalesce(p_moves, '[]'::jsonb)) loop
    v_delta := coalesce((v_move ->> 'delta')::integer, 0);
    continue when v_delta = 0 or coalesce(v_move ->> 'product_id', '') = '';
    update public.products
      set quantity = coalesce(quantity, 0) + v_delta
      where id::text = v_move ->> 'product_id';
    insert into public.stock_moves (product_id, name, delta, reason, ref, author)
      values (v_move ->> 'product_id', v_move ->> 'name', v_delta, coalesce(v_move ->> 'reason', p_reason, p_table), v_saved ->> 'token', v_author);
  end loop;

  return v_saved;
end;
$$;

revoke all on function public.vh_tool_save(text, uuid, integer, jsonb, jsonb, text) from public, anon;
grant execute on function public.vh_tool_save(text, uuid, integer, jsonb, jsonb, text) to authenticated, service_role;

-- Make PostgREST see the new tables and function straight away.
notify pgrst, 'reload schema';
