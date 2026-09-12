-- OP-024: Platform Owner Control Center (Wave 2, Release 0.4)
--
-- OP-032 only allowed reading platform_roles (self, or administrators
-- reading anyone). No one could assign a role through the application —
-- role assignment was service_role-only. This adds write access so the
-- Control Center can actually manage roles, not just display them.
--
-- Only platform_owner may assign platform_owner or administrator roles
-- (prevents an administrator from promoting themselves further).
-- administrator may assign/revoke the moderator role only.

begin;

create policy "Platform owner manages all platform roles"
  on public.platform_roles
  for all
  to authenticated
  using (public.has_platform_role(array['platform_owner']))
  with check (public.has_platform_role(array['platform_owner']));

create policy "Administrators manage moderator role only"
  on public.platform_roles
  for all
  to authenticated
  using (
    public.has_platform_role(array['administrator'])
    and role = 'moderator'
  )
  with check (
    public.has_platform_role(array['administrator'])
    and role = 'moderator'
  );

commit;
