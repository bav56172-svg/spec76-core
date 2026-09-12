create extension if not exists pgcrypto;

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 160),
  description text not null check (char_length(trim(description)) between 10 and 5000),
  city text not null check (char_length(trim(city)) between 2 and 120),
  location_text text,
  urgency text not null default 'normal'
    check (urgency in ('normal', 'urgent', 'scheduled')),
  desired_start_at timestamptz,
  status text not null default 'draft'
    check (status in (
      'draft',
      'analyzing',
      'published',
      'matching',
      'offers_received',
      'accepted',
      'cancelled',
      'expired'
    )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists requests_customer_id_idx
  on public.requests(customer_id);

create index if not exists requests_status_created_at_idx
  on public.requests(status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists requests_set_updated_at on public.requests;
create trigger requests_set_updated_at
before update on public.requests
for each row execute function public.set_updated_at();

alter table public.requests enable row level security;

drop policy if exists "Customers can read own requests" on public.requests;
create policy "Customers can read own requests"
on public.requests
for select
to authenticated
using (customer_id = auth.uid());

drop policy if exists "Customers can create own requests" on public.requests;
create policy "Customers can create own requests"
on public.requests
for insert
to authenticated
with check (customer_id = auth.uid());

drop policy if exists "Customers can update own draft requests" on public.requests;
create policy "Customers can update own draft requests"
on public.requests
for update
to authenticated
using (customer_id = auth.uid() and status = 'draft')
with check (customer_id = auth.uid());
