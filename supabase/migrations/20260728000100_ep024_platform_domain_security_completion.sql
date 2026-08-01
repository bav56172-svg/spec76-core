-- EP-024 security completion:
-- 1. Prevent projects from being reassigned between companies through normal UPDATE.
-- 2. Remove direct client execution rights from internal trigger functions.
-- 3. Remove anonymous execution rights from authorization helper functions.

begin;

create or replace function public.prevent_project_company_reassignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.company_id is distinct from old.company_id then
    raise exception 'A project cannot be moved to another company.';
  end if;

  return new;
end;
$$;

drop trigger if exists projects_prevent_company_reassignment
on public.projects;

create trigger projects_prevent_company_reassignment
before update of company_id
on public.projects
for each row
execute function public.prevent_project_company_reassignment();

-- Internal trigger functions are invoked by database triggers.
-- API roles must not be able to execute them directly.
revoke all on function public.set_updated_at()
  from public, anon, authenticated;

revoke all on function public.handle_new_user_profile()
  from public, anon, authenticated;

revoke all on function public.normalize_company_slug()
  from public, anon, authenticated;

revoke all on function public.add_initial_company_owner()
  from public, anon, authenticated;

revoke all on function public.validate_project_owner_membership()
  from public, anon, authenticated;

revoke all on function public.protect_company_owner_membership()
  from public, anon, authenticated;

revoke all on function public.prevent_removing_assigned_project_member()
  from public, anon, authenticated;

revoke all on function public.prevent_project_company_reassignment()
  from public, anon, authenticated;

-- Authorization helpers are used by authenticated RLS policies.
-- Anonymous clients do not need direct execution rights.
revoke all on function public.is_company_member(uuid)
  from anon;

revoke all on function public.has_company_role(uuid, text[])
  from anon;

revoke all on function public.can_access_project(uuid)
  from anon;

revoke all on function public.can_view_profile(uuid)
  from anon;

revoke all on function public.get_company_owner_id(uuid)
  from anon;

-- Preserve explicit authenticated access required by current RLS policies.
grant execute on function public.is_company_member(uuid)
  to authenticated;

grant execute on function public.has_company_role(uuid, text[])
  to authenticated;

grant execute on function public.can_access_project(uuid)
  to authenticated;

grant execute on function public.can_view_profile(uuid)
  to authenticated;

grant execute on function public.get_company_owner_id(uuid)
  to authenticated;

commit;
