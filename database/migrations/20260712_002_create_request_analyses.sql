create table if not exists public.request_analyses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  services jsonb not null default '[]'::jsonb,
  equipment jsonb not null default '[]'::jsonb,
  materials jsonb not null default '[]'::jsonb,
  estimated_scope text,
  confidence numeric(4,3) not null check (confidence >= 0 and confidence <= 1),
  clarifications jsonb not null default '[]'::jsonb,
  status text not null check (status in ('completed', 'needs_clarification')),
  is_current boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists request_analyses_request_id_idx
  on public.request_analyses(request_id, created_at desc);

create unique index if not exists request_analyses_one_current_idx
  on public.request_analyses(request_id)
  where is_current = true;

alter table public.request_analyses enable row level security;

drop policy if exists "Customers can read analyses of own requests" on public.request_analyses;
create policy "Customers can read analyses of own requests"
on public.request_analyses
for select
to authenticated
using (
  exists (
    select 1 from public.requests r
    where r.id = request_id and r.customer_id = auth.uid()
  )
);

drop policy if exists "Customers can create analyses of own requests" on public.request_analyses;
create policy "Customers can create analyses of own requests"
on public.request_analyses
for insert
to authenticated
with check (
  exists (
    select 1 from public.requests r
    where r.id = request_id and r.customer_id = auth.uid()
  )
);

drop policy if exists "Customers can update analyses of own requests" on public.request_analyses;
create policy "Customers can update analyses of own requests"
on public.request_analyses
for update
to authenticated
using (
  exists (
    select 1 from public.requests r
    where r.id = request_id and r.customer_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.requests r
    where r.id = request_id and r.customer_id = auth.uid()
  )
);
