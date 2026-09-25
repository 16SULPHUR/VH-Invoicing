-- Payments collected against credit bills. Each row settles part of one invoice.
create table if not exists public.credit_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id bigint not null,
  invoice_date text not null,
  customer_name text not null,
  amount numeric not null check (amount > 0),
  method text not null check (method in ('cash', 'upi')),
  paid_on date not null default current_date,
  note text,
  author text,
  created_at timestamp with time zone default now()
);

create index if not exists credit_payments_customer_idx on public.credit_payments (customer_name);
create index if not exists credit_payments_invoice_idx on public.credit_payments (invoice_id);

alter table public.credit_payments enable row level security;

create policy credit_payments_rw on public.credit_payments for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
