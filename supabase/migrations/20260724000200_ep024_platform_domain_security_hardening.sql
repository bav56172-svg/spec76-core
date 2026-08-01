-- EP-024 follow-up: remove recursive company policy lookup and harden owner trigger.

begin;

create or replace function public.get_company_owner_id(target_company_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.owner_id
  from public.companies c
  where c.id = target_company_id;
$$;

revoke all on function public.get_company_owner_id(uuid) from public;
grant execute on function public.get_company_owner_id(uuid) to authenticated;

create or replace function public.protect_company_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_company_id uuid;
  owner_count integer;
begin
  if tg_op = 'DELETE' then
    affected_company_id := old.company_id;

    if old.role = 'owner' then
      raise exception 'Transfer company ownership before removing the owner.';
    end if;

    return old;
  end if;

  affected_company_id := new.company_id;

  if tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner' then
    raise exception 'Transfer company ownership before changing the owner role.';
  end if;

  if new.role = 'owner' then
    select count(*)
      into owner_count
    from public.company_members cm
    where cm.company_id = affected_company_id
      and cm.role = 'owner'
      and (
        tg_op <> 'UPDATE'
        or cm.user_id <> old.user_id
      );

    if owner_count > 0 then
      raise exception 'A company can have only one owner.';
    end if;
  end if;

  return new;
end;
$$;

drop policy if exists companies_update_management on public.companies;

create policy companies_update_management
on public.companies
for update
to authenticated
using (public.has_company_role(id, array['owner', 'admin']))
with check (
  public.has_company_role(id, array['owner', 'admin'])
  and owner_id is not distinct from public.get_company_owner_id(id)
);

commit;
