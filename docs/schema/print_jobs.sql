-- Phone printing queue. The phone adds a job with its scanned items; one till claims it,
-- saves the bill through create_bill and prints it. Safe to run more than once.
-- Replaces print_command, which is left in place but no longer used.

create table if not exists public.print_jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending', 'claimed', 'saved', 'failed', 'cancelled')),
  items jsonb not null default '[]'::jsonb,
  scan_ids bigint[] not null default '{}',
  customer_name text not null default '',
  customer_phone text not null default '',
  payment_mode text not null check (payment_mode in ('cash', 'upi', 'credit')),
  note text not null default '',
  requested_by text,
  station text,
  claimed_at timestamptz,
  invoice_id bigint,
  invoice_date timestamptz,
  error text
);

create index if not exists print_jobs_open_idx on public.print_jobs (created_at)
  where status in ('pending', 'claimed');

alter table public.print_jobs enable row level security;
drop policy if exists "print_jobs_authenticated" on public.print_jobs;
create policy "print_jobs_authenticated" on public.print_jobs
  for all to authenticated using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'print_jobs'
  ) then
    alter publication supabase_realtime add table public.print_jobs;
  end if;
end $$;

-- One till wins each job. A claim older than a minute (the till closed mid-job) can be taken over.
create or replace function public.claim_print_job(p_id uuid, p_station text)
returns public.print_jobs
language sql
as $$
  update public.print_jobs
  set status = 'claimed', station = p_station, claimed_at = now(), updated_at = now(), error = null
  where id = p_id
    and (status = 'pending' or (status = 'claimed' and claimed_at < now() - interval '1 minute'))
  returning *;
$$;

-- Saves the job's bill once, clears its scans and marks it saved, all in one transaction.
-- Calling it again returns the bill already saved.
create or replace function public.finish_print_job(p_id uuid, p_bill jsonb)
returns jsonb
language plpgsql
as $$
declare
  job public.print_jobs;
  result jsonb;
begin
  select * into job from public.print_jobs where id = p_id for update;
  if job.id is null then
    raise exception 'Print job not found' using errcode = 'P0002';
  end if;

  if job.invoice_id is not null then
    return jsonb_build_object(
      'invoice', (select to_jsonb(i) from public.invoices i where i.date = job.invoice_date),
      'stock_failures', '[]'::jsonb,
      'duplicate', true
    );
  end if;

  if job.status = 'cancelled' then
    raise exception 'This print was cancelled on the phone';
  end if;

  result := public.create_bill(p_bill);

  update public.print_jobs
  set status = 'saved',
      invoice_id = (result->'invoice'->>'id')::bigint,
      invoice_date = (result->'invoice'->>'date')::timestamptz,
      error = null,
      updated_at = now()
  where id = p_id;

  delete from public.scanned_products where id = any (job.scan_ids);

  return result;
end;
$$;
