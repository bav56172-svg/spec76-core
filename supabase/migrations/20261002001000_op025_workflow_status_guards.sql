-- OP-025: Workflow Foundation (Wave 3, Release 0.4)
--
-- Investigation for this operation found the request lifecycle declared in
-- requests.status's CHECK ('draft','analyzing','published','matching',
-- 'offers_received','accepted','cancelled','expired') is NOT actually
-- implemented anywhere in code: the only status write path in the whole
-- codebase is accept_offer(), which moves a request straight from
-- 'draft' to 'accepted'. The intermediate stages are unused schema, not
-- unused-but-planned workflow — building guards for them now would be
-- guessing a business process that was never built. See ADR-027 (updated).
--
-- What IS real: the "Customers can update own draft requests" RLS policy
-- (20260729000100_create_requests.sql) only restricts UPDATE to rows where
-- status = 'draft', but its WITH CHECK clause only verifies customer_id —
-- it does not restrict what the customer may set status TO. A customer can
-- currently call `.update({status: 'accepted'})` directly on their own
-- draft request, bypassing accept_offer() entirely: no competing offers
-- get rejected, no project gets created, the data ends up inconsistent.
-- This migration closes exactly that gap, not a hypothetical one.
--
-- Offers already have a tighter RLS gate (`using (status = 'submitted' ...)`,
-- `with check (status in ('submitted', 'withdrawn') ...)`), so the
-- equivalent exposure doesn't exist there — the offer guard below is
-- defense-in-depth (terminal-state lock), not closing an active bypass.
--
-- projects.status is left untouched in this migration: no code path
-- changes it after creation at all (always created 'active' by
-- accept_offer(), never updated again anywhere) — there is nothing yet to
-- guard. Revisit when a "complete/archive project" feature exists.

begin;

-- requests: the only real transition is draft -> accepted, and it must
-- only happen from inside accept_offer() (which sets the GUC below for
-- the duration of its own transaction), never from a direct client update.
create or replace function public.validate_request_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status = 'accepted' then
    raise exception 'Request status accepted is terminal and cannot be changed';
  end if;

  if new.status = 'accepted'
    and coalesce(current_setting('app.internal_status_transition', true), '') <> 'on'
  then
    raise exception 'Request status may only move to accepted via accept_offer()';
  end if;

  return new;
end;
$$;

create trigger requests_status_transition_guard
  before update of status on public.requests
  for each row
  execute function public.validate_request_status_transition();

-- offers: allow-list matches exactly what accept_offer() and the existing
-- RLS "with check" already do (submitted -> accepted/rejected/withdrawn);
-- terminal states can't be changed again by anyone, including future
-- security definer code.
create or replace function public.validate_offer_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status in ('accepted', 'rejected', 'withdrawn') then
    raise exception 'Offer status % is terminal and cannot be changed', old.status;
  end if;

  if old.status = 'submitted' and new.status in ('accepted', 'rejected', 'withdrawn') then
    return new;
  end if;

  raise exception 'Illegal offer status transition from % to %', old.status, new.status;
end;
$$;

create trigger offers_status_transition_guard
  before update of status on public.offers
  for each row
  execute function public.validate_offer_status_transition();

-- accept_offer() must be exempted from its own new guard for the one
-- legitimate request transition it performs. set_config(..., true) is
-- transaction-local — it is visible to the trigger fired by the UPDATE
-- below and automatically resets at the end of this function's
-- transaction, so it cannot leak into any other request.
--
-- Separately discovered while testing the guard end-to-end on apps-serve:
-- this function has inserted into `projects (..., title, ...)` since it
-- was first written (20260729000500_create_project_activation.sql), but
-- public.projects has never had a `title` column — only `name`
-- (20260724000100_ep024_platform_domain_foundation.sql). The whole
-- accept-offer -> create-project path has been broken since 2026-07-29;
-- fixed here (title -> name) since this function is already being
-- redefined for the guard exemption above.
create or replace function public.accept_offer(p_offer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_offer public.offers%rowtype;
  target_request public.requests%rowtype;
  existing_project_id uuid;
  created_project_id uuid;
begin
  select *
    into target_offer
  from public.offers
  where id = p_offer_id
  for update;

  if target_offer.id is null then
    raise exception 'Offer not found';
  end if;

  select *
    into target_request
  from public.requests
  where id = target_offer.request_id
  for update;

  if target_request.id is null then
    raise exception 'Request not found';
  end if;

  if target_request.customer_id <> auth.uid() then
    raise exception 'Access denied';
  end if;

  select id
    into existing_project_id
  from public.projects
  where request_id = target_request.id;

  if existing_project_id is not null then
    if target_offer.status = 'accepted' then
      return existing_project_id;
    end if;

    raise exception 'Project already exists for this request';
  end if;

  if target_request.status = 'accepted' then
    raise exception 'Another offer is already accepted';
  end if;

  update public.offers
  set status = case when id = p_offer_id then 'accepted' else 'rejected' end
  where request_id = target_request.id
    and status in ('submitted', 'accepted');

  perform set_config('app.internal_status_transition', 'on', true);

  update public.requests
  set status = 'accepted'
  where id = target_request.id;

  insert into public.projects (
    request_id,
    accepted_offer_id,
    company_id,
    owner_id,
    name,
    description,
    status
  )
  values (
    target_request.id,
    target_offer.id,
    target_offer.company_id,
    target_request.customer_id,
    target_request.title,
    target_request.description,
    'active'
  )
  returning id into created_project_id;

  return created_project_id;
end;
$$;

grant execute on function public.accept_offer(uuid) to authenticated;

-- Unrelated-to-guards bug fix found during this investigation: the UI
-- (app/projects/[id]/page.tsx STATUS_LABELS) already has Russian labels
-- for 'published' and 'in_progress' project statuses, and types/project.ts
-- declares all 7 values, but the DB CHECK here only ever allowed 5 — the
-- UI was built against a wider status set than the database could store.
alter table public.projects drop constraint projects_status_check;
alter table public.projects add constraint projects_status_check
  check (status in ('draft', 'published', 'active', 'in_progress', 'completed', 'cancelled', 'archived'));

commit;
