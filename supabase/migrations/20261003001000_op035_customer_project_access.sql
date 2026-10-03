-- OP-035: Customer Project Access (see ADR-029)
--
-- accept_offer() (20260729000500_create_project_activation.sql) sets
-- projects.owner_id to the CUSTOMER and company_id to the contractor's
-- company. Two EP-024-era pieces disagreed with that:
--
-- 1. validate_project_owner_membership() required owner_id to be a
--    company_members row of company_id — impossible for a customer,
--    who is never a member of the contractor's company. This alone
--    made accept_offer() fail on every call.
-- 2. projects_select_members only granted SELECT to company members —
--    no path existed for owner_id to read the row at all. Every child
--    table (tasks, project_communication, project_timelines,
--    documents) already grants access via
--    "projects.owner_id = auth.uid() OR companies.owner_id = auth.uid()"
--    — i.e. the rest of the schema already assumed owner_id = customer.
--    projects itself just never caught up.
--
-- This migration brings projects in line with the pattern its own
-- child tables already use, rather than inventing a new one.

begin;

-- 1. Remove the trigger that incorrectly required owner_id to be a
-- company member. Nothing else references this function.
drop trigger if exists projects_validate_owner_membership on public.projects;
drop function if exists public.validate_project_owner_membership();

comment on column public.projects.owner_id is
  'Customer who requested the work (or another assigned responsible user). Grants read/update access alongside company membership — see ADR-029.';

-- 2. SELECT: add the owner_id path, matching tasks/communication/timeline/documents.
drop policy if exists projects_select_members on public.projects;
create policy projects_select_members
on public.projects
for select
to authenticated
using (
  public.is_company_member(company_id)
  or owner_id = auth.uid()
);

-- 3. UPDATE: the old with_check required is_company_member(company_id)
-- unconditionally, so a customer could never satisfy it even via the
-- owner_id branch allowed by `using`. Fixed to mirror `using`.
drop policy if exists projects_update_management_or_assignee on public.projects;
create policy projects_update_management_or_assignee
on public.projects
for update
to authenticated
using (
  public.has_company_role(company_id, array['owner', 'admin'])
  or owner_id = auth.uid()
)
with check (
  (public.is_company_member(company_id) and public.has_company_role(company_id, array['owner', 'admin']))
  or owner_id = auth.uid()
);

commit;
