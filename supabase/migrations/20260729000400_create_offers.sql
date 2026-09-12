create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  price numeric(14,2) not null check (price > 0),
  currency text not null default 'RUB' check (currency = 'RUB'),
  proposed_days integer check (proposed_days is null or proposed_days between 1 and 365),
  message text check (message is null or char_length(trim(message)) <= 2000),
  status text not null default 'submitted'
    check (status in ('submitted', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, company_id)
);

create index if not exists offers_request_status_price_idx
  on public.offers(request_id, status, price);

create unique index if not exists offers_one_accepted_per_request_idx
  on public.offers(request_id)
  where status = 'accepted';

drop trigger if exists offers_set_updated_at on public.offers;
create trigger offers_set_updated_at
before update on public.offers
for each row execute function public.set_updated_at();

alter table public.offers enable row level security;

drop policy if exists "Customers read offers for own requests" on public.offers;
create policy "Customers read offers for own requests"
on public.offers for select to authenticated
using (
  exists (
    select 1 from public.requests
    where requests.id = offers.request_id
      and requests.customer_id = auth.uid()
  )
);

drop policy if exists "Company owners read own offers" on public.offers;
create policy "Company owners read own offers"
on public.offers for select to authenticated
using (
  exists (
    select 1 from public.companies
    where companies.id = offers.company_id
      and companies.owner_id = auth.uid()
  )
);

drop policy if exists "Matched company owners submit offers" on public.offers;
create policy "Matched company owners submit offers"
on public.offers for insert to authenticated
with check (
  exists (
    select 1 from public.companies
    where companies.id = offers.company_id
      and companies.owner_id = auth.uid()
  )
  and exists (
    select 1 from public.request_matches
    where request_matches.request_id = offers.request_id
      and request_matches.company_id = offers.company_id
      and request_matches.is_current = true
  )
);

drop policy if exists "Company owners update submitted offers" on public.offers;
create policy "Company owners update submitted offers"
on public.offers for update to authenticated
using (
  status = 'submitted'
  and exists (
    select 1 from public.companies
    where companies.id = offers.company_id
      and companies.owner_id = auth.uid()
  )
)
with check (
  status in ('submitted', 'withdrawn')
  and exists (
    select 1 from public.companies
    where companies.id = offers.company_id
      and companies.owner_id = auth.uid()
  )
);

create or replace function public.accept_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_request_id uuid;
  target_status text;
begin
  select request_id
    into target_request_id
  from public.offers
  where id = p_offer_id;

  if target_request_id is null then
    raise exception 'Offer not found';
  end if;

  if not exists (
    select 1
    from public.requests
    where id = target_request_id
      and customer_id = auth.uid()
  ) then
    raise exception 'Access denied';
  end if;

  select status
    into target_status
  from public.requests
  where id = target_request_id
  for update;

  if target_status = 'accepted' then
    if exists (
      select 1 from public.offers
      where id = p_offer_id and status = 'accepted'
    ) then
      return;
    end if;

    raise exception 'Another offer is already accepted';
  end if;

  update public.offers
  set status = case when id = p_offer_id then 'accepted' else 'rejected' end
  where request_id = target_request_id
    and status in ('submitted', 'accepted');

  update public.requests
  set status = 'accepted'
  where id = target_request_id;
end;
$$;

grant execute on function public.accept_offer(uuid) to authenticated;
