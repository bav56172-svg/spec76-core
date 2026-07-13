create table if not exists public.project_activities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in (
    'project_created',
    'project_status_changed',
    'task_created',
    'task_status_changed'
  )),
  title text not null check (char_length(trim(title)) between 2 and 200),
  description text,
  metadata jsonb not null default '{}'::jsonb,
  source_key text,
  created_at timestamptz not null default now()
);

create index if not exists project_activities_project_created_idx
  on public.project_activities(project_id, created_at desc);

create unique index if not exists project_activities_source_key_idx
  on public.project_activities(project_id, source_key)
  where source_key is not null;

alter table public.project_activities enable row level security;

drop policy if exists "Project participants read activities" on public.project_activities;
create policy "Project participants read activities"
on public.project_activities for select to authenticated
using (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = project_activities.project_id
      and (
        projects.owner_id = auth.uid()
        or companies.owner_id = auth.uid()
      )
  )
);

drop policy if exists "Project participants create activities" on public.project_activities;
create policy "Project participants create activities"
on public.project_activities for insert to authenticated
with check (
  actor_id = auth.uid()
  and exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = project_activities.project_id
      and (
        projects.owner_id = auth.uid()
        or companies.owner_id = auth.uid()
      )
  )
);

create or replace function public.log_project_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'projects' and tg_op = 'INSERT' then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata, source_key
    ) values (
      new.id,
      auth.uid(),
      'project_created',
      'Проект создан',
      'Принятое предложение преобразовано в проект выполнения.',
      jsonb_build_object('status', new.status),
      'project:' || new.id::text || ':created'
    ) on conflict do nothing;
    return new;
  end if;

  if tg_table_name = 'projects' and tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata
    ) values (
      new.id,
      auth.uid(),
      'project_status_changed',
      'Статус проекта изменён',
      'Статус проекта изменён с ' || old.status || ' на ' || new.status || '.',
      jsonb_build_object('from', old.status, 'to', new.status)
    );
    return new;
  end if;

  if tg_table_name = 'tasks' and tg_op = 'INSERT' then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata
    ) values (
      new.project_id,
      auth.uid(),
      'task_created',
      'Создана задача',
      new.title,
      jsonb_build_object('task_id', new.id, 'status', new.status)
    );
    return new;
  end if;

  if tg_table_name = 'tasks' and tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata
    ) values (
      new.project_id,
      auth.uid(),
      'task_status_changed',
      'Статус задачи изменён',
      new.title || ': ' || old.status || ' → ' || new.status,
      jsonb_build_object('task_id', new.id, 'from', old.status, 'to', new.status)
    );
    return new;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists projects_activity_created on public.projects;
create trigger projects_activity_created
after insert on public.projects
for each row execute function public.log_project_activity();

drop trigger if exists projects_activity_status on public.projects;
create trigger projects_activity_status
after update of status on public.projects
for each row execute function public.log_project_activity();

drop trigger if exists tasks_activity_created on public.tasks;
create trigger tasks_activity_created
after insert on public.tasks
for each row execute function public.log_project_activity();

drop trigger if exists tasks_activity_status on public.tasks;
create trigger tasks_activity_status
after update of status on public.tasks
for each row execute function public.log_project_activity();

insert into public.project_activities (
  project_id, actor_id, event_type, title, description, metadata, source_key, created_at
)
select
  projects.id,
  projects.owner_id,
  'project_created',
  'Проект создан',
  'Событие восстановлено при подключении Activity Engine.',
  jsonb_build_object('status', projects.status, 'backfilled', true),
  'project:' || projects.id::text || ':created',
  projects.created_at
from public.projects
on conflict do nothing;
