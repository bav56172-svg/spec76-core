-- OP-026: Audit Foundation (Wave 3, Release 0.4)
--
-- platform_roles (OP-032) was given write access in OP-024 (Control Center)
-- so platform_owner/administrator can assign roles through the app, but no
-- audit trail was ever added for it — who assigned what role to whom is
-- currently untracked. SECURITY_STANDARD.md requires administrative/critical
-- actions to be auditable. This closes that gap first, before anything else.
--
-- audit_log is deliberately NOT an extension of project_activities: that
-- table's project_id is NOT NULL (events only make sense inside a project),
-- while role assignment happens outside any project context.
--
-- See ADR-027 for the decision record (why this table shape, why
-- platform_roles first, why not reuse project_activities).

begin;

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);
create index audit_log_created_at_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;

-- Only platform_owner/administrator may read the audit log. No insert
-- policy is granted to any role — rows are written exclusively by the
-- security definer trigger function below, never directly by a client.
create policy audit_log_select_platform_owner_administrators
  on public.audit_log
  for select
  to authenticated
  using (public.has_platform_role(array['administrator', 'platform_owner']));

grant select on table public.audit_log to authenticated;

create or replace function public.log_platform_role_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_log (actor_id, entity_type, entity_id, action, old_data, new_data)
  values (
    auth.uid(),
    'platform_roles',
    coalesce(new.user_id, old.user_id),
    lower(tg_op),
    case when tg_op = 'DELETE' then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

create trigger platform_roles_audit
  after insert or update or delete on public.platform_roles
  for each row
  execute function public.log_platform_role_audit();

commit;
