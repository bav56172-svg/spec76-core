-- EP-023 AI usage lifecycle and rate-limit verification.
-- Safe for a local Supabase database: every fixture is rolled back.

begin;

do $$
begin
  if to_regclass('public.ai_usage') is null then
    raise exception 'public.ai_usage is missing';
  end if;

  if to_regprocedure('public.reserve_ai_usage(uuid,uuid,text,uuid)') is null then
    raise exception 'public.reserve_ai_usage is missing';
  end if;

  if to_regprocedure(
    'public.finalize_ai_usage(uuid,uuid,text,text,text,integer,integer)'
  ) is null then
    raise exception 'public.finalize_ai_usage is missing';
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
    raise exception 'ai_usage RLS/FORCE RLS is not preserved';
  end if;

  if not pg_catalog.has_table_privilege(
    'authenticated',
    'public.ai_usage',
    'SELECT'
  ) then
    raise exception 'authenticated cannot select accessible ai_usage rows';
  end if;

  if pg_catalog.has_table_privilege(
    'authenticated',
    'public.ai_usage',
    'INSERT, UPDATE, DELETE'
  ) then
    raise exception 'authenticated has ai_usage write privileges';
  end if;

  if has_function_privilege(
    'anon',
    'public.reserve_ai_usage(uuid,uuid,text,uuid)',
    'EXECUTE'
  ) then
    raise exception 'anon can execute reserve_ai_usage';
  end if;

  if has_function_privilege(
    'anon',
    'public.finalize_ai_usage(uuid,uuid,text,text,text,integer,integer)',
    'EXECUTE'
  ) then
    raise exception 'anon can execute finalize_ai_usage';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.reserve_ai_usage(uuid,uuid,text,uuid)',
    'EXECUTE'
  ) then
    raise exception 'authenticated can execute reserve_ai_usage';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.finalize_ai_usage(uuid,uuid,text,text,text,integer,integer)',
    'EXECUTE'
  ) then
    raise exception 'authenticated can execute finalize_ai_usage';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.reserve_ai_usage(uuid,uuid,text,uuid)',
    'EXECUTE'
  ) then
    raise exception 'service_role cannot execute reserve_ai_usage';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.finalize_ai_usage(uuid,uuid,text,text,text,integer,integer)',
    'EXECUTE'
  ) then
    raise exception 'service_role cannot execute finalize_ai_usage';
  end if;
end;
$$;

create temporary table ep023_ai_usage_test_ids (
  actor_user_id uuid not null,
  outsider_user_id uuid not null,
  company_id uuid not null,
  project_id uuid not null,
  request_id uuid not null
) on commit drop;

insert into ep023_ai_usage_test_ids values (
  extensions.gen_random_uuid(),
  extensions.gen_random_uuid(),
  extensions.gen_random_uuid(),
  extensions.gen_random_uuid(),
  extensions.gen_random_uuid()
);

grant select on ep023_ai_usage_test_ids to service_role;

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  actor_user_id,
  'authenticated',
  'authenticated',
  'ep023-actor-' || actor_user_id::text || '@example.test',
  '',
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
from ep023_ai_usage_test_ids
union all
select
  outsider_user_id,
  'authenticated',
  'authenticated',
  'ep023-outsider-' || outsider_user_id::text || '@example.test',
  '',
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
from ep023_ai_usage_test_ids;

-- The production trigger requires the authenticated actor to be the initial
-- company owner. Reproduce that JWT claim instead of bypassing the trigger.
select set_config(
  'request.jwt.claim.sub',
  actor_user_id::text,
  true
)
from ep023_ai_usage_test_ids;

insert into public.companies (id, owner_id, name, slug)
select
  company_id,
  actor_user_id,
  'EP-023 AI Usage Test',
  'ep023-ai-' || left(replace(company_id::text, '-', ''), 12)
from ep023_ai_usage_test_ids;

do $$
declare
  v_company_id uuid;
  v_actor_user_id uuid;
  v_project_id uuid;
begin
  select company_id, actor_user_id, project_id
  into v_company_id, v_actor_user_id, v_project_id
  from ep023_ai_usage_test_ids;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'projects'
      and column_name = 'title'
  ) then
    execute $sql$
      insert into public.projects (id, company_id, owner_id, title, status)
      values ($1, $2, $3, 'EP-023 AI Usage Test', 'draft')
    $sql$ using v_project_id, v_company_id, v_actor_user_id;
  else
    execute $sql$
      insert into public.projects (id, company_id, owner_id, name, status)
      values ($1, $2, $3, 'EP-023 AI Usage Test', 'draft')
    $sql$ using v_project_id, v_company_id, v_actor_user_id;
  end if;
end;
$$;

set local role service_role;

do $$
declare
  v_actor_user_id uuid;
  v_outsider_user_id uuid;
  v_project_id uuid;
  v_request_id uuid;
  v_first public.ai_usage;
  v_repeat public.ai_usage;
  v_final public.ai_usage;
  v_rate_limit_blocked boolean := false;
  v_access_blocked boolean := false;
  v_request_conflict_blocked boolean := false;
  v_terminal_conflict_blocked boolean := false;
begin
  select actor_user_id, outsider_user_id, project_id, request_id
  into v_actor_user_id, v_outsider_user_id, v_project_id, v_request_id
  from ep023_ai_usage_test_ids;

  v_first := public.reserve_ai_usage(
    v_actor_user_id,
    v_project_id,
    'verification',
    v_request_id
  );

  if v_first.status <> 'reserved' or v_first.completed_at is not null then
    raise exception 'reserve did not create a valid reserved row';
  end if;

  v_repeat := public.reserve_ai_usage(
    v_actor_user_id,
    v_project_id,
    'verification',
    v_request_id
  );

  if v_repeat.id <> v_first.id then
    raise exception 'idempotent reserve created a duplicate row';
  end if;

  begin
    perform public.reserve_ai_usage(
      v_actor_user_id,
      v_project_id,
      'conflicting-operation',
      v_request_id
    );
  exception
    when unique_violation then
      if sqlerrm = 'AI_USAGE_REQUEST_ID_CONFLICT' then
        v_request_conflict_blocked := true;
      else
        raise;
      end if;
  end;

  if not v_request_conflict_blocked then
    raise exception 'conflicting request_id reuse was not blocked';
  end if;

  v_final := public.finalize_ai_usage(
    v_actor_user_id,
    v_request_id,
    'completed',
    'verification-provider',
    'verification-model',
    10,
    20
  );

  if v_final.status <> 'completed' or v_final.completed_at is null then
    raise exception 'finalize did not create a valid terminal row';
  end if;

  v_repeat := public.finalize_ai_usage(
    v_actor_user_id,
    v_request_id,
    'completed',
    'ignored-provider',
    'ignored-model',
    999,
    999
  );

  if v_repeat.id <> v_final.id
    or v_repeat.provider <> v_final.provider
    or v_repeat.input_tokens <> v_final.input_tokens
  then
    raise exception 'same-state finalize is not idempotent';
  end if;

  begin
    perform public.finalize_ai_usage(
      v_actor_user_id,
      v_request_id,
      'failed'
    );
  exception
    when raise_exception then
      if sqlerrm = 'AI_USAGE_TERMINAL_STATE_CONFLICT' then
        v_terminal_conflict_blocked := true;
      else
        raise;
      end if;
  end;

  if not v_terminal_conflict_blocked then
    raise exception 'completed-to-failed transition was not blocked';
  end if;

  begin
    perform public.reserve_ai_usage(
      v_outsider_user_id,
      v_project_id,
      'verification',
      extensions.gen_random_uuid()
    );
  exception
    when insufficient_privilege then
      v_access_blocked := true;
  end;

  if not v_access_blocked then
    raise exception 'project access check did not block the outsider';
  end if;

  for request_number in 2..10 loop
    perform public.reserve_ai_usage(
      v_actor_user_id,
      v_project_id,
      'verification',
      extensions.gen_random_uuid()
    );
  end loop;

  begin
    perform public.reserve_ai_usage(
      v_actor_user_id,
      v_project_id,
      'verification',
      extensions.gen_random_uuid()
    );
  exception
    when raise_exception then
      if sqlerrm = 'AI_RATE_LIMIT_EXCEEDED' then
        v_rate_limit_blocked := true;
      else
        raise;
      end if;
  end;

  if not v_rate_limit_blocked then
    raise exception 'the eleventh request was not rate-limited';
  end if;
end;
$$;

reset role;

do $$
begin
  if (select count(*) from public.ai_usage) <> 10 then
    raise exception 'unexpected AI usage row count after verification';
  end if;

  raise notice 'EP-023 AI usage lifecycle and rate-limit verification passed';
end;
$$;

rollback;
