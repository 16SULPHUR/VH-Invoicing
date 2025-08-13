import { supabase } from "../supabaseClient";

export async function getTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getLedger() {
  const { data, error } = await supabase
    .from("ledger_view")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getTrialBalance() {
  const { data, error } = await supabase
    .from("ledger_view")
    .select("account_name, debit, credit");
  if (error) throw error;

  const balance = {};
  (data || []).forEach(({ account_name, debit, credit }) => {
    const numericDebit = Number(debit) || 0;
    const numericCredit = Number(credit) || 0;
    if (!balance[account_name]) balance[account_name] = { debit: 0, credit: 0 };
    balance[account_name].debit += numericDebit;
    balance[account_name].credit += numericCredit;
  });

  return Object.entries(balance).map(([account, { debit, credit }]) => ({
    account,
    debit,
    credit,
  }));
}

export async function getGSTOutput() {
  const { data, error } = await supabase
    .from("ledger_view")
    .select("*")
    .eq("account_name", "GST Output");
  if (error) throw error;

  const rows = data || [];
  const totalGST = rows.reduce((sum, row) => sum + (Number(row.credit) || 0), 0);
  return { transactions: rows, totalGST };
}

export async function getCollectionsByDateRange(startISO, endISO) {
  const { data, error } = await supabase
    .from("ledger_view")
    .select("account_name, debit, date")
    .gte("date", startISO)
    .lte("date", endISO)
    .in("account_name", ["Cash", "UPI", "Accounts Receivable"]);
  if (error) throw error;

  const sums = { cash: 0, upi: 0, credit: 0 };
  (data || []).forEach((row) => {
    const amount = Number(row.debit) || 0;
    if (row.account_name === "Cash") sums.cash += amount;
    else if (row.account_name === "UPI") sums.upi += amount;
    else if (row.account_name === "Accounts Receivable") sums.credit += amount;
  });
  return sums;
}


// Cashbook SQL helper (documentation) for creating required tables and policies
export const CASHBOOK_SQL = `
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
`;


