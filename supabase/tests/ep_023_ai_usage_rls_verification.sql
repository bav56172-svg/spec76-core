-- EP-023 AI Usage RLS Verification Tests
-- Source of truth: Supabase
-- Purpose: verify security boundaries for public.ai_usage

begin;

-- =====================================================
-- 1. Table existence
-- =====================================================

do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'ai_usage'
  ) then
    raise exception 'ai_usage table does not exist';
  end if;
end;
$$;


-- =====================================================
-- 2. RLS enabled
-- =====================================================

do $$
declare
  rls_enabled boolean;
begin
  select relrowsecurity
  into rls_enabled
  from pg_class
  where oid = 'public.ai_usage'::regclass;

  if rls_enabled is not true then
    raise exception 'RLS is not enabled for ai_usage';
  end if;
end;
$$;


-- =====================================================
-- 3. FORCE RLS enabled
-- =====================================================

do $$
declare
  force_rls_enabled boolean;
begin
  select relforcerowsecurity
  into force_rls_enabled
  from pg_class
  where oid = 'public.ai_usage'::regclass;

  if force_rls_enabled is not true then
    raise exception 'FORCE RLS is not enabled for ai_usage';
  end if;
end;
$$;


-- =====================================================
-- 4. Required SELECT policy exists
-- =====================================================

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_usage'
      and policyname = 'ai_usage_select_access'
  ) then
    raise exception 'Missing ai_usage_select_access policy';
  end if;
end;
$$;


-- =====================================================
-- 5. Client write policies must not exist
-- =====================================================

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_usage'
      and cmd in ('INSERT', 'UPDATE', 'DELETE')
      and roles @> array['authenticated']::name[]
  ) then
    raise exception 'Client write policy exists for ai_usage';
  end if;
end;
$$;


-- =====================================================
-- 6. Project access dependency exists
-- =====================================================

do $$
begin
  if not exists (
    select 1
    from pg_proc
    where proname = 'can_access_project'
      and pronamespace = 'public'::regnamespace
  ) then
    raise exception 'Missing public.can_access_project function';
  end if;
end;
$$;


-- =====================================================
-- Verification completed
-- =====================================================

raise notice 'EP-023 AI Usage RLS verification passed';

rollback;
