-- Tables
create table if not exists public.cash_accounts (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  is_active boolean not null default true,
  created_at timestamp with time zone default now()
);

create table if not exists public.cash_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.cash_accounts(id) on delete cascade,
  txn_date date not null,
  amount numeric not null, -- positive=inflow, negative=outflow
  type text not null check (type in ('inflow','outflow','bank_deposit','correction')),
  description text,
  author text,
  created_at timestamp with time zone default now()
);

create table if not exists public.cash_reconciliations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.cash_accounts(id) on delete cascade,
  as_of_date date not null,
  balance numeric not null,
  note text,
  author text,
  created_at timestamp with time zone default now(),
  unique (account_id, as_of_date)
);

-- Row Level Security
alter table public.cash_accounts enable row level security;
alter table public.cash_transactions enable row level security;
alter table public.cash_reconciliations enable row level security;

-- Basic policy allowing authenticated users full access (tighten as needed)
create policy if not exists cash_accounts_rw on public.cash_accounts for all 
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy if not exists cash_transactions_rw on public.cash_transactions for all 
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy if not exists cash_reconciliations_rw on public.cash_reconciliations for all 
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
