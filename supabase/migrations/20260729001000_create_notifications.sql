create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  activity_id uuid references public.project_activities(id) on delete cascade,
  event_type text not null,
  channel text not null default 'in_app'
    check (channel in ('in_app')),
  status text not null default 'unread'
    check (status in ('unread', 'read', 'archived')),
  title text not null check (char_length(trim(title)) between 2 and 200),
  message text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, activity_id, channel)
);

create index if not exists notifications_user_status_created_idx
  on public.notifications(user_id, status, created_at desc);

create index if not exists notifications_project_created_idx
  on public.notifications(project_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.set_notification_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notifications_set_updated_at on public.notifications;
create trigger notifications_set_updated_at
before update on public.notifications
for each row execute function public.set_notification_updated_at();

create or replace function public.create_notifications_from_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  project_owner uuid;
  company_owner uuid;
begin
  select
    projects.owner_id,
    companies.owner_id
  into
    project_owner,
    company_owner
  from public.projects
  left join public.companies on companies.id = projects.company_id
  where projects.id = new.project_id;

  if project_owner is not null and project_owner is distinct from new.actor_id then
    insert into public.notifications (
      user_id, project_id, activity_id, event_type, title, message
    ) values (
      project_owner, new.project_id, new.id, new.event_type, new.title, new.description
    ) on conflict do nothing;
  end if;

  if company_owner is not null
     and company_owner is distinct from new.actor_id
     and company_owner is distinct from project_owner then
    insert into public.notifications (
      user_id, project_id, activity_id, event_type, title, message
    ) values (
      company_owner, new.project_id, new.id, new.event_type, new.title, new.description
    ) on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists project_activity_notifications on public.project_activities;
create trigger project_activity_notifications
after insert on public.project_activities
for each row execute function public.create_notifications_from_activity();
