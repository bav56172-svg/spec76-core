-- EP-024: PROD-compatible platform domain upgrade
-- Target baseline: existing PROD companies/projects schema verified on 2026-08-01.
-- This is an Upgrade migration. It must not be used as a substitute for the
-- existing Greenfield migrations on a clean installation.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if to_regclass('public.companies') is null then
    raise exception 'EP-024 upgrade prerequisite failed: public.companies is missing';
  end if;

  if to_regclass('public.projects') is null then
    raise exception 'EP-024 upgrade prerequisite failed: public.projects is missing';
  end if;

  if exists (select 1 from public.companies where owner_id is null) then
    raise exception 'EP-024 upgrade prerequisite failed: companies with NULL owner_id exist';
  end if;

  if exists (
    select 1
    from public.companies c
    left join auth.users u on u.id = c.owner_id
    where u.id is null
  ) then
    raise exception 'EP-024 upgrade prerequisite failed: a company owner is missing from auth.users';
  end if;

  if exists (
    select 1
    from public.projects p
    left join public.companies c on c.id = p.company_id
    where c.id is null
  ) then
    raise exception 'EP-024 upgrade prerequisite failed: a project references a missing company';
  end if;

  if exists (
    select 1
    from public.projects p
    left join auth.users u on u.id = p.owner_id
    where u.id is null
  ) then
    raise exception 'EP-024 upgrade prerequisite failed: a project owner is missing from auth.users';
  end if;

  if exists (select 1 from public.companies where name is null or btrim(name) = '') then
    raise exception 'EP-024 upgrade prerequisite failed: companies with blank names exist';
  end if;

  if exists (select 1 from public.projects where title is null or btrim(title) = '') then
    raise exception 'EP-024 upgrade prerequisite failed: projects with blank titles exist';
  end if;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text not null default 'ru',
  timezone text not null default 'Europe/Moscow',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length_check check (
    display_name is null or char_length(btrim(display_name)) between 1 and 100
  ),
  constraint profiles_avatar_url_length_check check (
    avatar_url is null or char_length(avatar_url) <= 2048
  ),
  constraint profiles_locale_length_check check (char_length(locale) between 2 and 20),
  constraint profiles_timezone_length_check check (char_length(timezone) between 1 and 100)
);

create table if not exists public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_members_pkey primary key (company_id, user_id),
  constraint company_members_role_check check (role in ('owner', 'admin', 'member'))
);

insert into public.profiles (id, display_name)
select u.id, nullif(btrim(coalesce(u.raw_user_meta_data ->> 'display_name', '')), '')
from auth.users u
on conflict (id) do nothing;

insert into public.company_members (company_id, user_id, role)
select c.id, c.owner_id, 'owner'
from public.companies c
on conflict (company_id, user_id)
do update set role = 'owner', updated_at = now();

insert into public.company_members (company_id, user_id, role)
select distinct p.company_id, p.owner_id, 'member'
from public.projects p
where p.owner_id is not null
on conflict (company_id, user_id) do nothing;

do $$
begin
  if exists (
    select 1
    from public.companies c
    left join public.company_members cm
      on cm.company_id = c.id
     and cm.user_id = c.owner_id
     and cm.role = 'owner'
    where cm.user_id is null
  ) then
    raise exception 'EP-024 owner membership backfill failed';
  end if;

  if exists (
    select company_id
    from public.company_members
    where role = 'owner'
    group by company_id
    having count(*) <> 1
  ) then
    raise exception 'EP-024 owner membership validation failed';
  end if;
end;
$$;

alter table public.companies alter column owner_id drop default;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.companies'::regclass
      and conname = 'companies_owner_id_fkey'
  ) then
    alter table public.companies
      add constraint companies_owner_id_fkey
      foreign key (owner_id)
      references auth.users(id)
      on delete set null
      not valid;

    alter table public.companies validate constraint companies_owner_id_fkey;
  end if;
end;
$$;

alter table public.companies add column if not exists slug text;

update public.companies
set slug = coalesce(
  nullif(
    left(
      trim(both '-' from regexp_replace(
        lower(coalesce(nullif(btrim(name), ''), 'company')),
        '[^a-z0-9]+',
        '-',
        'g'
      )),
      60
    ),
    ''
  ),
  'company'
) || '-' || left(replace(id::text, '-', ''), 12)
where slug is null or btrim(slug) = '';

alter table public.companies alter column slug set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.companies'::regclass
      and conname = 'companies_name_length_check'
  ) then
    alter table public.companies
      add constraint companies_name_length_check
      check (char_length(btrim(name)) between 1 and 160)
      not valid;
    alter table public.companies validate constraint companies_name_length_check;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.companies'::regclass
      and conname = 'companies_slug_format_check'
  ) then
    alter table public.companies
      add constraint companies_slug_format_check
      check (
        slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
        and char_length(slug) between 3 and 80
      )
      not valid;
    alter table public.companies validate constraint companies_slug_format_check;
  end if;
end;
$$;

create unique index if not exists companies_slug_key on public.companies(slug);
create index if not exists companies_owner_id_idx on public.companies(owner_id) where owner_id is not null;
create unique index if not exists company_members_one_owner_idx on public.company_members(company_id) where role = 'owner';
create index if not exists company_members_user_id_idx on public.company_members(user_id);
create index if not exists company_members_company_role_idx on public.company_members(company_id, role);
create index if not exists projects_company_status_idx on public.projects(company_id, status);
create index if not exists projects_company_updated_at_idx on public.projects(company_id, updated_at desc);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.normalize_company_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name = btrim(new.name);
  new.slug = lower(btrim(new.slug));
  return new;
end;
$$;

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.has_company_role(target_company_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
      and cm.role = any(allowed_roles)
  );
$$;

create or replace function public.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    join public.company_members cm on cm.company_id = p.company_id
    where p.id = target_project_id
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.can_view_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id = auth.uid()
    or exists (
      select 1
      from public.company_members viewer
      join public.company_members target on target.company_id = viewer.company_id
      where viewer.user_id = auth.uid()
        and target.user_id = target_user_id
    );
$$;

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

create or replace function public.add_initial_company_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is null then
    raise exception 'A new company must have an owner.';
  end if;
  if new.owner_id <> auth.uid() then
    raise exception 'The authenticated user must be the initial company owner.';
  end if;
  insert into public.company_members (company_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create or replace function public.validate_project_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is not null and not exists (
    select 1
    from public.company_members cm
    where cm.company_id = new.company_id
      and cm.user_id = new.owner_id
  ) then
    raise exception 'Project owner must be a member of the project company.';
  end if;
  return new;
end;
$$;

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
    select count(*) into owner_count
    from public.company_members cm
    where cm.company_id = affected_company_id
      and cm.role = 'owner'
      and (tg_op <> 'UPDATE' or cm.user_id <> old.user_id);

    if owner_count > 0 then
      raise exception 'A company can have only one owner.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.prevent_removing_assigned_project_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.projects p
    where p.company_id = old.company_id
      and p.owner_id = old.user_id
  ) then
    raise exception 'Reassign owned projects before removing this company member.';
  end if;
  return old;
end;
$$;

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

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists companies_normalize_slug on public.companies;
create trigger companies_normalize_slug before insert or update of name, slug on public.companies
for each row execute function public.normalize_company_slug();

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists companies_add_initial_owner on public.companies;
create trigger companies_add_initial_owner after insert on public.companies
for each row execute function public.add_initial_company_owner();

drop trigger if exists company_members_protect_owner on public.company_members;
create trigger company_members_protect_owner before insert or update of role or delete on public.company_members
for each row execute function public.protect_company_owner_membership();

drop trigger if exists company_members_prevent_assigned_member_removal on public.company_members;
create trigger company_members_prevent_assigned_member_removal before delete on public.company_members
for each row execute function public.prevent_removing_assigned_project_member();

drop trigger if exists company_members_set_updated_at on public.company_members;
create trigger company_members_set_updated_at before update on public.company_members
for each row execute function public.set_updated_at();

drop trigger if exists projects_validate_owner_membership on public.projects;
create trigger projects_validate_owner_membership before insert or update of company_id, owner_id on public.projects
for each row execute function public.validate_project_owner_membership();

drop trigger if exists projects_prevent_company_reassignment on public.projects;
create trigger projects_prevent_company_reassignment before update of company_id on public.projects
for each row execute function public.prevent_project_company_reassignment();

drop trigger if exists auth_users_create_profile on auth.users;
create trigger auth_users_create_profile after insert on auth.users
for each row execute function public.handle_new_user_profile();

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.projects enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.companies from anon, authenticated;
revoke all on table public.company_members from anon, authenticated;
revoke all on table public.projects from anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.companies to authenticated;
grant select, insert, update, delete on table public.company_members to authenticated;
grant select, insert, update, delete on table public.projects to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.companies to service_role;
grant all on table public.company_members to service_role;
grant all on table public.projects to service_role;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user_profile() from public, anon, authenticated;
revoke all on function public.normalize_company_slug() from public, anon, authenticated;
revoke all on function public.add_initial_company_owner() from public, anon, authenticated;
revoke all on function public.validate_project_owner_membership() from public, anon, authenticated;
revoke all on function public.protect_company_owner_membership() from public, anon, authenticated;
revoke all on function public.prevent_removing_assigned_project_member() from public, anon, authenticated;
revoke all on function public.prevent_project_company_reassignment() from public, anon, authenticated;

revoke all on function public.is_company_member(uuid) from public, anon;
revoke all on function public.has_company_role(uuid, text[]) from public, anon;
revoke all on function public.can_access_project(uuid) from public, anon;
revoke all on function public.can_view_profile(uuid) from public, anon;
revoke all on function public.get_company_owner_id(uuid) from public, anon;

grant execute on function public.is_company_member(uuid) to authenticated;
grant execute on function public.has_company_role(uuid, text[]) to authenticated;
grant execute on function public.can_access_project(uuid) to authenticated;
grant execute on function public.can_view_profile(uuid) to authenticated;
grant execute on function public.get_company_owner_id(uuid) to authenticated;

drop policy if exists "Enable insert for authenticated users only" on public.companies;
drop policy if exists "Enable read access for all users" on public.companies;
drop policy if exists "Users can create own projects" on public.projects;
drop policy if exists "Users can delete own projects" on public.projects;
drop policy if exists "Users can update own projects" on public.projects;
drop policy if exists "Users can view own projects" on public.projects;

drop policy if exists profiles_select_shared_company on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
drop policy if exists companies_select_members on public.companies;
drop policy if exists companies_insert_self_owned on public.companies;
drop policy if exists companies_update_management on public.companies;
drop policy if exists companies_delete_owner on public.companies;
drop policy if exists company_members_select_company_members on public.company_members;
drop policy if exists company_members_insert_management on public.company_members;
drop policy if exists company_members_update_owner on public.company_members;
drop policy if exists company_members_delete_management_or_self on public.company_members;
drop policy if exists projects_select_members on public.projects;
drop policy if exists projects_insert_members on public.projects;
drop policy if exists projects_update_management_or_assignee on public.projects;
drop policy if exists projects_delete_management on public.projects;

create policy profiles_select_shared_company on public.profiles
for select to authenticated using (public.can_view_profile(id));

create policy profiles_update_self on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy companies_select_members on public.companies
for select to authenticated using (public.is_company_member(id));

create policy companies_insert_self_owned on public.companies
for insert to authenticated with check (owner_id = auth.uid());

create policy companies_update_management on public.companies
for update to authenticated
using (public.has_company_role(id, array['owner', 'admin']))
with check (
  public.has_company_role(id, array['owner', 'admin'])
  and owner_id is not distinct from public.get_company_owner_id(id)
);

create policy companies_delete_owner on public.companies
for delete to authenticated using (public.has_company_role(id, array['owner']));

create policy company_members_select_company_members on public.company_members
for select to authenticated using (public.is_company_member(company_id));

create policy company_members_insert_management on public.company_members
for insert to authenticated
with check (
  role <> 'owner'
  and (
    public.has_company_role(company_id, array['owner'])
    or (role = 'member' and public.has_company_role(company_id, array['admin']))
  )
);

create policy company_members_update_owner on public.company_members
for update to authenticated
using (public.has_company_role(company_id, array['owner']) and role <> 'owner')
with check (
  public.has_company_role(company_id, array['owner'])
  and role in ('admin', 'member')
);

create policy company_members_delete_management_or_self on public.company_members
for delete to authenticated
using (
  role <> 'owner'
  and (
    user_id = auth.uid()
    or public.has_company_role(company_id, array['owner'])
    or (role = 'member' and public.has_company_role(company_id, array['admin']))
  )
);

create policy projects_select_members on public.projects
for select to authenticated using (public.is_company_member(company_id));

create policy projects_insert_members on public.projects
for insert to authenticated
with check (public.is_company_member(company_id) and owner_id = auth.uid());

create policy projects_update_management_or_assignee on public.projects
for update to authenticated
using (
  public.has_company_role(company_id, array['owner', 'admin'])
  or owner_id = auth.uid()
)
with check (
  public.is_company_member(company_id)
  and (
    public.has_company_role(company_id, array['owner', 'admin'])
    or owner_id = auth.uid()
  )
);

create policy projects_delete_management on public.projects
for delete to authenticated
using (public.has_company_role(company_id, array['owner', 'admin']));

comment on table public.profiles is 'Application profiles linked one-to-one with auth.users.';
comment on table public.company_members is 'Authoritative company membership and role mapping.';
comment on column public.companies.owner_id is 'Administrative ownership metadata; authorization is derived from company_members.';
comment on column public.projects.owner_id is 'Assigned responsible user; project access is derived from company_members.';

do $$
begin
  if exists (
    select 1
    from public.companies c
    left join public.company_members cm
      on cm.company_id = c.id
     and cm.user_id = c.owner_id
     and cm.role = 'owner'
    where cm.user_id is null
  ) then
    raise exception 'EP-024 final validation failed: missing owner membership';
  end if;

  if exists (
    select 1
    from public.projects p
    left join public.company_members cm
      on cm.company_id = p.company_id
     and cm.user_id = p.owner_id
    where cm.user_id is null
  ) then
    raise exception 'EP-024 final validation failed: project owner is not a company member';
  end if;

  if exists (select 1 from public.companies where slug is null or btrim(slug) = '') then
    raise exception 'EP-024 final validation failed: company slug is missing';
  end if;
end;
$$;

commit;
