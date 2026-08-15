-- OP-032: Role Model Foundation (Wave 1 — Identity & Access, Release 0.4)
-- Introduces platform-level roles (distinct from company-scoped
-- company_members.role) so that moderation, audit, and future AI
-- Operations (Wave 5) have an authorization foundation to build on.
--
-- Renumbered from the RELEASE_BACKLOG.md placeholder "OP-019 Role Model
-- Foundation" to OP-032 to resolve a collision with the already-completed
-- OP-019 (SPEC76 OS Skeleton) recorded in engineering/registry/OPERATION_REGISTRY.md.

begin;

create table public.platform_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_roles_role_check check (
    role = any(array['user', 'moderator', 'administrator', 'platform_owner'])
  )
);

create trigger platform_roles_set_updated_at
  before update on public.platform_roles
  for each row
  execute function public.set_updated_at();

-- Mirrors has_company_role(): checks the caller's own platform-level role.
create or replace function public.has_platform_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_roles pr
    where pr.user_id = auth.uid()
      and pr.role = any(allowed_roles)
  );
$$;

alter table public.platform_roles enable row level security;

-- Every authenticated user may read their own platform role (e.g. to
-- decide whether to show admin/moderator navigation in the UI).
create policy platform_roles_select_self
  on public.platform_roles
  for select
  to authenticated
  using (user_id = auth.uid());

-- Only an existing administrator or platform_owner may change roles.
-- No insert/update/delete policy is granted to plain authenticated users:
-- role assignment happens via service_role (admin action), not client-side.
create policy platform_roles_select_administrators
  on public.platform_roles
  for select
  to authenticated
  using (public.has_platform_role(array['administrator', 'platform_owner']));

grant select on table public.platform_roles to authenticated;
grant execute on function public.has_platform_role(text[]) to authenticated;

commit;
