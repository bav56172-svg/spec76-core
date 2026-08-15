begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

-- EP-023 AI usage lifecycle and technical rate limit.
-- Production migration version: 20260810191040.
-- This migration is intentionally fail-closed because the approved lifecycle
-- design does not permit synthetic backfill of existing usage rows.
do $$
begin
  if to_regclass('public.ai_usage') is null then
    raise exception 'EP-023 lifecycle prerequisite failed: public.ai_usage is missing';
  end if;
end;
$$;

-- Prevent a concurrent writer from changing the preflight result between the
-- empty-table check and the NOT NULL lifecycle columns.
lock table public.ai_usage in access exclusive mode;

do $$
begin

  if exists (select 1 from public.ai_usage limit 1) then
    raise exception 'EP-023 lifecycle prerequisite failed: public.ai_usage must be empty';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'ai_usage'
      and c.relrowsecurity
      and c.relforcerowsecurity
  ) then
    raise exception 'EP-023 lifecycle prerequisite failed: ai_usage RLS/FORCE RLS is missing';
  end if;

  if pg_catalog.has_table_privilege(
    'authenticated',
    'public.ai_usage',
    'INSERT, UPDATE, DELETE'
  ) then
    raise exception 'EP-023 lifecycle prerequisite failed: authenticated has ai_usage write privileges';
  end if;
end;
$$;

alter table public.ai_usage
  add column request_id uuid not null,
  add column status text not null,
  add column completed_at timestamptz;

alter table public.ai_usage
  add constraint ai_usage_request_id_key unique (request_id),
  add constraint ai_usage_status_check
    check (status in ('reserved', 'completed', 'failed')),
  add constraint ai_usage_lifecycle_completion_check
    check (
      (status = 'reserved' and completed_at is null)
      or
      (status in ('completed', 'failed') and completed_at is not null)
    );

comment on column public.ai_usage.request_id is
  'Server-generated idempotency key for one logical AI operation.';

comment on column public.ai_usage.status is
  'Lifecycle state: reserved, completed, or failed.';

comment on column public.ai_usage.completed_at is
  'Terminal transition timestamp; NULL while the operation is reserved.';

create function public.reserve_ai_usage(
  p_actor_user_id uuid,
  p_project_id uuid,
  p_operation_type text,
  p_request_id uuid
)
returns public.ai_usage
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid;
  v_existing public.ai_usage;
  v_inserted public.ai_usage;
  v_recent_request_count integer;
  v_rate_limit constant integer := 10;
  v_rate_window constant interval := interval '1 minute';
begin
  if p_actor_user_id is null
    or p_project_id is null
    or p_request_id is null
    or p_operation_type is null
    or btrim(p_operation_type) = ''
  then
    raise exception using
      errcode = '22023',
      message = 'AI_USAGE_INVALID_REQUEST';
  end if;

  -- The request lock makes conflicting use of one request_id deterministic.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('ai-request:' || p_request_id::text, 0)
  );

  -- The actor lock serializes limit checks and reservations for one user.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('ai-user:' || p_actor_user_id::text, 0)
  );

  select p.company_id
  into v_company_id
  from public.projects p
  join public.company_members cm
    on cm.company_id = p.company_id
   and cm.user_id = p_actor_user_id
  where p.id = p_project_id;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'AI_USAGE_PROJECT_ACCESS_DENIED';
  end if;

  select au.*
  into v_existing
  from public.ai_usage au
  where au.request_id = p_request_id;

  if found then
    if v_existing.user_id = p_actor_user_id
      and v_existing.project_id = p_project_id
      and v_existing.company_id = v_company_id
      and v_existing.operation_type = btrim(p_operation_type)
    then
      return v_existing;
    end if;

    raise exception using
      errcode = '23505',
      message = 'AI_USAGE_REQUEST_ID_CONFLICT';
  end if;

  select count(*)::integer
  into v_recent_request_count
  from public.ai_usage au
  where au.user_id = p_actor_user_id
    and au.created_at >= pg_catalog.clock_timestamp() - v_rate_window;

  if v_recent_request_count >= v_rate_limit then
    raise exception using
      errcode = 'P0001',
      message = 'AI_RATE_LIMIT_EXCEEDED';
  end if;

  insert into public.ai_usage (
    request_id,
    project_id,
    company_id,
    user_id,
    operation_type,
    status
  ) values (
    p_request_id,
    p_project_id,
    v_company_id,
    p_actor_user_id,
    btrim(p_operation_type),
    'reserved'
  )
  returning * into v_inserted;

  return v_inserted;
end;
$$;

comment on function public.reserve_ai_usage(uuid, uuid, text, uuid) is
  'Atomically validates project access, enforces 10 requests per rolling minute per user, and creates an idempotent AI usage reservation.';

create function public.finalize_ai_usage(
  p_actor_user_id uuid,
  p_request_id uuid,
  p_status text,
  p_provider text default null,
  p_model text default null,
  p_input_tokens integer default null,
  p_output_tokens integer default null
)
returns public.ai_usage
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.ai_usage;
  v_finalized public.ai_usage;
begin
  if p_actor_user_id is null
    or p_request_id is null
    or p_status not in ('completed', 'failed')
    or (p_input_tokens is not null and p_input_tokens < 0)
    or (p_output_tokens is not null and p_output_tokens < 0)
  then
    raise exception using
      errcode = '22023',
      message = 'AI_USAGE_INVALID_FINALIZATION';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('ai-request:' || p_request_id::text, 0)
  );

  select au.*
  into v_existing
  from public.ai_usage au
  where au.request_id = p_request_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'AI_USAGE_NOT_FOUND';
  end if;

  if v_existing.user_id <> p_actor_user_id
    or not exists (
      select 1
      from public.projects p
      join public.company_members cm
        on cm.company_id = p.company_id
       and cm.user_id = p_actor_user_id
      where p.id = v_existing.project_id
        and p.company_id = v_existing.company_id
    )
  then
    raise exception using
      errcode = '42501',
      message = 'AI_USAGE_FINALIZE_ACCESS_DENIED';
  end if;

  if v_existing.status = p_status then
    return v_existing;
  end if;

  if v_existing.status <> 'reserved' then
    raise exception using
      errcode = 'P0001',
      message = 'AI_USAGE_TERMINAL_STATE_CONFLICT';
  end if;

  update public.ai_usage au
  set
    status = p_status,
    provider = nullif(btrim(p_provider), ''),
    model = nullif(btrim(p_model), ''),
    input_tokens = p_input_tokens,
    output_tokens = p_output_tokens,
    completed_at = pg_catalog.clock_timestamp()
  where au.id = v_existing.id
  returning * into v_finalized;

  return v_finalized;
end;
$$;

comment on function public.finalize_ai_usage(uuid, uuid, text, text, text, integer, integer) is
  'Idempotently transitions an authorized AI usage reservation to completed or failed.';

revoke all on function public.reserve_ai_usage(uuid, uuid, text, uuid)
from public, anon, authenticated;

revoke all on function public.finalize_ai_usage(uuid, uuid, text, text, text, integer, integer)
from public, anon, authenticated;

grant execute on function public.reserve_ai_usage(uuid, uuid, text, uuid)
to service_role;

grant execute on function public.finalize_ai_usage(uuid, uuid, text, text, text, integer, integer)
to service_role;

-- Existing RLS, FORCE RLS, SELECT policy, and client table grants are preserved.

-- Rollback before runtime activation and only while public.ai_usage is empty:
-- drop function public.finalize_ai_usage(uuid, uuid, text, text, text, integer, integer);
-- drop function public.reserve_ai_usage(uuid, uuid, text, uuid);
-- alter table public.ai_usage
--   drop constraint ai_usage_lifecycle_completion_check,
--   drop constraint ai_usage_status_check,
--   drop constraint ai_usage_request_id_key,
--   drop column completed_at,
--   drop column status,
--   drop column request_id;

commit;
