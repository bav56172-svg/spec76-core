alter table public.companies
  add column if not exists description text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists city text,
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'active', 'suspended', 'archived')),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.company_services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  service_name text not null check (char_length(trim(service_name)) between 2 and 160),
  created_at timestamptz not null default now(),
  unique (company_id, service_name)
);

create table if not exists public.company_equipment (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  equipment_name text not null check (char_length(trim(equipment_name)) between 2 and 160),
  created_at timestamptz not null default now(),
  unique (company_id, equipment_name)
);

create table if not exists public.request_matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  matched_services jsonb not null default '[]'::jsonb,
  matched_equipment jsonb not null default '[]'::jsonb,
  reasons jsonb not null default '[]'::jsonb,
  is_current boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists company_services_company_id_idx
  on public.company_services(company_id);

create index if not exists company_equipment_company_id_idx
  on public.company_equipment(company_id);

create index if not exists request_matches_request_score_idx
  on public.request_matches(request_id, score desc);

create unique index if not exists request_matches_one_current_company_idx
  on public.request_matches(request_id, company_id)
  where is_current = true;

alter table public.company_services enable row level security;
alter table public.company_equipment enable row level security;
alter table public.request_matches enable row level security;

drop policy if exists "Authenticated users can read company services" on public.company_services;
create policy "Authenticated users can read company services"
on public.company_services for select to authenticated using (true);

drop policy if exists "Company owners manage company services" on public.company_services;
create policy "Company owners manage company services"
on public.company_services for all to authenticated
using (
  exists (
    select 1 from public.companies
    where companies.id = company_services.company_id
      and companies.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.companies
    where companies.id = company_services.company_id
      and companies.owner_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can read company equipment" on public.company_equipment;
create policy "Authenticated users can read company equipment"
on public.company_equipment for select to authenticated using (true);

drop policy if exists "Company owners manage company equipment" on public.company_equipment;
create policy "Company owners manage company equipment"
on public.company_equipment for all to authenticated
using (
  exists (
    select 1 from public.companies
    where companies.id = company_equipment.company_id
      and companies.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.companies
    where companies.id = company_equipment.company_id
      and companies.owner_id = auth.uid()
  )
);

drop policy if exists "Customers can read matches of own requests" on public.request_matches;
create policy "Customers can read matches of own requests"
on public.request_matches for select to authenticated
using (
  exists (
    select 1 from public.requests
    where requests.id = request_matches.request_id
      and requests.customer_id = auth.uid()
  )
);

drop policy if exists "Customers can create matches for own requests" on public.request_matches;
create policy "Customers can create matches for own requests"
on public.request_matches for insert to authenticated
with check (
  exists (
    select 1 from public.requests
    where requests.id = request_matches.request_id
      and requests.customer_id = auth.uid()
  )
);

drop policy if exists "Customers can update matches of own requests" on public.request_matches;
create policy "Customers can update matches of own requests"
on public.request_matches for update to authenticated
using (
  exists (
    select 1 from public.requests
    where requests.id = request_matches.request_id
      and requests.customer_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.requests
    where requests.id = request_matches.request_id
      and requests.customer_id = auth.uid()
  )
);
