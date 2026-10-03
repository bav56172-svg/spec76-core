-- OP-034: Public Equipment Catalog Foundation (see ADR-028)
--
-- The original ТЗ (engineering/foundational/TZ_SPEC76_ORIGINAL.md, section
-- 4.1) describes a public equipment catalog as its own module, separate
-- from the request/offer exchange — browsable without logging in. Nothing
-- like that exists today: company_equipment (OP-023) is
-- { id, company_id, equipment_name, created_at } only, readable by any
-- authenticated user (not anon), with no category/price/photo/publish
-- status at all.
--
-- This migration extends company_equipment in place rather than adding a
-- parallel "Ads" table (as the original PRD proposed) — it's the same
-- real-world object (one piece of a company's equipment), just missing
-- the fields a public listing needs. See ADR-028 for the full decision
-- record, including why city stays on companies (not duplicated here)
-- and why this ships with one cover photo, not a gallery.

begin;

alter table public.company_equipment
  add column if not exists category text,
  add column if not exists price_hour numeric(12, 2),
  add column if not exists price_shift numeric(12, 2),
  add column if not exists description text,
  add column if not exists cover_photo_path text,
  add column if not exists status text not null default 'draft',
  add column if not exists updated_at timestamptz not null default now();

alter table public.company_equipment
  add constraint company_equipment_category_check check (
    category is null or category in (
      'excavator', 'mini_excavator', 'dump_truck', 'truck_crane',
      'manipulator', 'aerial_platform', 'loader', 'bulldozer',
      'roller', 'grader', 'drilling_rig', 'lowboy_trailer',
      'vacuum_truck', 'septic_truck', 'municipal_equipment', 'other'
    )
  ),
  add constraint company_equipment_price_hour_check check (
    price_hour is null or price_hour > 0
  ),
  add constraint company_equipment_price_shift_check check (
    price_shift is null or price_shift > 0
  ),
  add constraint company_equipment_status_check check (
    status in ('draft', 'published', 'archived')
  );

create trigger company_equipment_set_updated_at
  before update on public.company_equipment
  for each row
  execute function public.set_updated_at();

-- Public (anon) catalog visibility: only published listings belonging to
-- an active company. The existing "Authenticated users can read company
-- equipment" policy (using (true)) already covers every authenticated
-- read, including drafts, for the internal matching algorithm
-- (services/contractorMatching.ts) — unchanged, not narrowed here.
--
-- company_equipment already has a table-level GRANT to anon (appears to
-- be a Supabase default-privilege on new tables); companies does NOT —
-- its EP-024 migration only granted authenticated. Both are required: the
-- GRANT for anon to query the table at all, and the RLS policy below for
-- which rows it may see (public catalog company info only: active
-- companies, no draft/suspended/archived).
grant select on table public.companies to anon;

create policy "Anonymous users read active companies"
  on public.companies
  for select
  to anon
  using (status = 'active');

create policy "Anonymous users read published equipment of active companies"
  on public.company_equipment
  for select
  to anon
  using (
    status = 'published'
    and exists (
      select 1 from public.companies
      where companies.id = company_equipment.company_id
        and companies.status = 'active'
    )
  );

-- Storage bucket for equipment cover photos. Public read (listing photos
-- are not sensitive), write restricted to the owning company by path
-- prefix convention: {company_id}/{filename}.
insert into storage.buckets (id, name, public)
values ('equipment-photos', 'equipment-photos', true)
on conflict (id) do nothing;

create policy "Anyone can view equipment photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'equipment-photos');

create policy "Company owners upload their own equipment photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'equipment-photos'
    and exists (
      select 1 from public.companies
      where companies.id::text = (storage.foldername(name))[1]
        and companies.owner_id = auth.uid()
    )
  );

create policy "Company owners manage their own equipment photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'equipment-photos'
    and exists (
      select 1 from public.companies
      where companies.id::text = (storage.foldername(name))[1]
        and companies.owner_id = auth.uid()
    )
  );

create policy "Company owners delete their own equipment photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'equipment-photos'
    and exists (
      select 1 from public.companies
      where companies.id::text = (storage.foldername(name))[1]
        and companies.owner_id = auth.uid()
    )
  );

commit;
