-- OP-036: Complete Project (see ADR-030)
--
-- OP-025 left projects.status unguarded because nothing changed it after
-- accept_offer() created the row as 'active'. Reviews (OP-037) must only be
-- writable for finished work, so a real "complete project" transition is
-- needed first.
--
-- Today the projects UPDATE policy (OP-035) lets the customer (owner_id) set
-- ANY status directly. Without a guard a customer could mark a project
-- 'completed' with no checks and no audit trail, and every later review
-- gate built on 'completed' would be meaningless. This migration:
--   1. guards the transition: status may only become 'completed' from inside
--      complete_project(), and 'completed' can only move on to 'archived';
--   2. adds complete_project(), callable only by the customer (owner_id);
--   3. writes an audit_log row for the completion (OP-026).
-- The generic project_status_changed row in project_activities is already
-- written by the existing log_project_activity() trigger.

begin;

create or replace function public.validate_project_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status = 'completed' and new.status <> 'archived' then
    raise exception 'Project status completed can only move to archived';
  end if;

  if new.status = 'completed'
    and coalesce(current_setting('app.internal_status_transition', true), '') <> 'on'
  then
    raise exception 'Project status may only move to completed via complete_project()';
  end if;

  return new;
end;
$$;

drop trigger if exists projects_status_transition_guard on public.projects;
create trigger projects_status_transition_guard
  before update of status on public.projects
  for each row
  execute function public.validate_project_status_transition();

create or replace function public.complete_project(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_project public.projects%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
    into target_project
  from public.projects
  where id = p_project_id
  for update;

  if target_project.id is null then
    raise exception 'Project not found';
  end if;

  if target_project.owner_id is distinct from auth.uid() then
    raise exception 'Access denied';
  end if;

  -- Idempotent: completing an already completed project is a no-op.
  if target_project.status = 'completed' then
    return;
  end if;

  if target_project.status not in ('active', 'in_progress') then
    raise exception 'Project in status % cannot be completed', target_project.status;
  end if;

  perform set_config('app.internal_status_transition', 'on', true);

  update public.projects
  set status = 'completed'
  where id = p_project_id;

  insert into public.audit_log (actor_id, entity_type, entity_id, action, old_data, new_data)
  values (
    auth.uid(),
    'projects',
    p_project_id,
    'complete',
    jsonb_build_object('status', target_project.status),
    jsonb_build_object('status', 'completed')
  );
end;
$$;

revoke all on function public.complete_project(uuid) from public;
grant execute on function public.complete_project(uuid) to authenticated;

commit;
