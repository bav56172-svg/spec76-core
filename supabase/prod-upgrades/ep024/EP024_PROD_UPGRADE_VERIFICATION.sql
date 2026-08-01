-- EP-024 PROD-compatible upgrade verification
-- READ ONLY. Returns one JSON document.

begin read only;

select jsonb_build_object(
  'meta', jsonb_build_object(
    'verification', 'EP-024 PROD-compatible upgrade',
    'mode', 'READ ONLY'
  ),
  'overall_pass', (
    to_regclass('public.profiles') is not null
    and to_regclass('public.company_members') is not null
    and not exists (
      select 1
      from public.companies c
      left join public.company_members cm
        on cm.company_id = c.id
       and cm.user_id = c.owner_id
       and cm.role = 'owner'
      where cm.user_id is null
    )
    and not exists (
      select 1
      from public.projects p
      left join public.company_members cm
        on cm.company_id = p.company_id
       and cm.user_id = p.owner_id
      where cm.user_id is null
    )
    and not exists (
      select 1
      from public.companies
      where slug is null or btrim(slug) = ''
    )
    and not has_function_privilege('anon', 'public.is_company_member(uuid)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.is_company_member(uuid)', 'EXECUTE')
  ),
  'tables', jsonb_build_object(
    'profiles_exists', to_regclass('public.profiles') is not null,
    'company_members_exists', to_regclass('public.company_members') is not null,
    'companies_exists', to_regclass('public.companies') is not null,
    'projects_exists', to_regclass('public.projects') is not null
  ),
  'data', jsonb_build_object(
    'companies_total', (select count(*) from public.companies),
    'projects_total', (select count(*) from public.projects),
    'profiles_total', (select count(*) from public.profiles),
    'company_members_total', (select count(*) from public.company_members),
    'missing_owner_memberships', (
      select count(*)
      from public.companies c
      left join public.company_members cm
        on cm.company_id = c.id
       and cm.user_id = c.owner_id
       and cm.role = 'owner'
      where cm.user_id is null
    ),
    'project_owners_without_membership', (
      select count(*)
      from public.projects p
      left join public.company_members cm
        on cm.company_id = p.company_id
       and cm.user_id = p.owner_id
      where cm.user_id is null
    ),
    'missing_slugs', (
      select count(*)
      from public.companies
      where slug is null or btrim(slug) = ''
    ),
    'broken_project_company_links', (
      select count(*)
      from public.projects p
      left join public.companies c on c.id = p.company_id
      where c.id is null
    ),
    'broken_project_request_links', (
      select count(*)
      from public.projects p
      left join public.requests r on r.id = p.request_id
      where p.request_id is not null and r.id is null
    ),
    'broken_project_offer_links', (
      select count(*)
      from public.projects p
      left join public.offers o on o.id = p.accepted_offer_id
      where p.accepted_offer_id is not null and o.id is null
    )
  ),
  'functions', (
    select jsonb_agg(jsonb_build_object(
      'name', p.proname,
      'security_definer', p.prosecdef,
      'owner', r.rolname
    ) order by p.proname)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_roles r on r.oid = p.proowner
    where n.nspname = 'public'
      and p.proname in (
        'is_company_member',
        'has_company_role',
        'can_access_project',
        'can_view_profile',
        'get_company_owner_id',
        'validate_project_owner_membership',
        'protect_company_owner_membership',
        'prevent_project_company_reassignment'
      )
  ),
  'function_privileges', (
    select jsonb_agg(jsonb_build_object(
      'role', roles.rolname,
      'function', funcs.proname,
      'has_execute', has_function_privilege(roles.rolname, funcs.oid, 'EXECUTE')
    ) order by roles.rolname, funcs.proname)
    from pg_roles roles
    cross join pg_proc funcs
    join pg_namespace ns on ns.oid = funcs.pronamespace
    where ns.nspname = 'public'
      and roles.rolname in ('anon', 'authenticated', 'service_role')
      and funcs.proname in (
        'is_company_member',
        'has_company_role',
        'can_access_project',
        'can_view_profile',
        'get_company_owner_id',
        'validate_project_owner_membership',
        'protect_company_owner_membership',
        'prevent_project_company_reassignment'
      )
  ),
  'policies', (
    select jsonb_agg(jsonb_build_object(
      'table', tablename,
      'policy', policyname,
      'roles', roles,
      'command', cmd,
      'using', qual,
      'check', with_check
    ) order by tablename, policyname)
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'companies', 'company_members', 'projects')
  ),
  'triggers', (
    select jsonb_agg(jsonb_build_object(
      'table', event_object_table,
      'trigger', trigger_name,
      'event', event_manipulation,
      'timing', action_timing
    ) order by event_object_table, trigger_name, event_manipulation)
    from information_schema.triggers
    where trigger_schema in ('public', 'auth')
      and trigger_name in (
        'auth_users_create_profile',
        'companies_add_initial_owner',
        'company_members_protect_owner',
        'company_members_prevent_assigned_member_removal',
        'projects_validate_owner_membership',
        'projects_prevent_company_reassignment'
      )
  )
) as ep024_prod_upgrade_verification;

rollback;
