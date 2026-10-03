-- Supplier invoices: bills from suppliers, what was paid against them, returns and kasar.
--
-- BEFORE RUNNING: snapshot first, e.g.
--   create schema if not exists backup_20261003_suppliers;
--   create table backup_20261003_suppliers.suppliers as table public.suppliers;
-- Everything below is additive (new columns on suppliers, new tables); nothing is dropped or rewritten.
-- supplier_id is stored as text so it works whatever type suppliers.id has.

alter table public.suppliers add column if not exists gstin text;
alter table public.suppliers add column if not exists phone text;
alter table public.suppliers add column if not exists city text;
alter table public.suppliers add column if not exists credit_days integer not null default 60;
alter table public.suppliers add column if not exists note text;

create table if not exists public.supplier_bills (
  id uuid primary key default gen_random_uuid(),
  supplier_id text not null,
  bill_no text not null,
  bill_date date not null,
  due_date date not null,
  taxable_amount numeric not null default 0,
  gst_rate numeric not null default 0,
  gst_amount numeric not null default 0,
  igst boolean not null default false,
  hsn text,
  total numeric not null,
  photo_url text,
  note text,
  stock_received_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  unique (supplier_id, bill_no)
);

-- kind: payment = money paid, return = goods sent back, discount = kasar / discount allowed.
-- A payment covering several bills is one row per bill sharing batch_id.
create table if not exists public.supplier_payments (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.supplier_bills(id) on delete cascade,
  supplier_id text not null,
  batch_id uuid,
  kind text not null default 'payment' check (kind in ('payment', 'return', 'discount')),
  amount numeric not null check (amount > 0),
  paid_on date not null,
  mode text check (mode in ('cheque', 'upi', 'bank', 'cash', 'other')),
  reference text,
  cheque_date date,
  bank text,
  note text,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists supplier_bills_supplier_idx on public.supplier_bills (supplier_id);
create index if not exists supplier_bills_due_idx on public.supplier_bills (due_date);
create index if not exists supplier_payments_bill_idx on public.supplier_payments (bill_id);
create index if not exists supplier_payments_supplier_idx on public.supplier_payments (supplier_id);

alter table public.supplier_bills enable row level security;
alter table public.supplier_payments enable row level security;

drop policy if exists supplier_bills_rw on public.supplier_bills;
create policy supplier_bills_rw on public.supplier_bills for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists supplier_payments_rw on public.supplier_payments;
create policy supplier_payments_rw on public.supplier_payments for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
