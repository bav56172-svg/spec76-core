create table if not exists public.project_timelines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 200),
  description text,
  planned_start date,
  planned_finish date,
  actual_start date,
  actual_finish date,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'completed', 'cancelled')),
  progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (planned_finish is null or planned_start is null or planned_finish >= planned_start),
  check (actual_finish is null or actual_start is null or actual_finish >= actual_start)
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  timeline_id uuid references public.project_timelines(id) on delete set null,
  title text not null check (char_length(trim(title)) between 2 and 200),
  description text,
  due_date date,
  completed_at timestamptz,
  status text not null default 'planned'
    check (status in ('planned', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_timelines_project_start_idx
  on public.project_timelines(project_id, planned_start);

create index if not exists project_milestones_project_due_idx
  on public.project_milestones(project_id, due_date);

create index if not exists project_milestones_timeline_idx
  on public.project_milestones(timeline_id);

create or replace function public.set_updated_at()
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

drop trigger if exists project_timelines_set_updated_at on public.project_timelines;
create trigger project_timelines_set_updated_at
before update on public.project_timelines
for each row execute function public.set_updated_at();

drop trigger if exists project_milestones_set_updated_at on public.project_milestones;
create trigger project_milestones_set_updated_at
before update on public.project_milestones
for each row execute function public.set_updated_at();

alter table public.project_timelines enable row level security;
alter table public.project_milestones enable row level security;

drop policy if exists "Project participants read timelines" on public.project_timelines;
create policy "Project participants read timelines"
on public.project_timelines for select to authenticated
using (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = project_timelines.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

drop policy if exists "Project participants manage timelines" on public.project_timelines;
create policy "Project participants manage timelines"
on public.project_timelines for all to authenticated
using (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = project_timelines.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = project_timelines.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

drop policy if exists "Project participants read milestones" on public.project_milestones;
create policy "Project participants read milestones"
on public.project_milestones for select to authenticated
using (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = project_milestones.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

drop policy if exists "Project participants manage milestones" on public.project_milestones;
create policy "Project participants manage milestones"
on public.project_milestones for all to authenticated
using (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = project_milestones.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = project_milestones.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

alter table public.project_activities
  drop constraint if exists project_activities_event_type_check;

alter table public.project_activities
  add constraint project_activities_event_type_check
  check (event_type in (
    'project_created',
    'project_status_changed',
    'task_created',
    'task_status_changed',
    'document_created',
    'document_archived',
    'document_restored',
    'document_version_created',
    'timeline_created',
    'timeline_status_changed',
    'milestone_created',
    'milestone_completed'
  ));

create or replace function public.log_timeline_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'project_timelines' and tg_op = 'INSERT' then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata
    ) values (
      new.project_id,
      auth.uid(),
      'timeline_created',
      'Создан этап временной шкалы',
      new.title,
      jsonb_build_object('timeline_id', new.id, 'status', new.status)
    );
    return new;
  end if;

  if tg_table_name = 'project_timelines' and tg_op = 'UPDATE'
     and old.status is distinct from new.status then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata
    ) values (
      new.project_id,
      auth.uid(),
      'timeline_status_changed',
      'Статус этапа изменён',
      new.title || ': ' || old.status || ' → ' || new.status,
      jsonb_build_object('timeline_id', new.id, 'from', old.status, 'to', new.status)
    );
    return new;
  end if;

  if tg_table_name = 'project_milestones' and tg_op = 'INSERT' then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata
    ) values (
      new.project_id,
      auth.uid(),
      'milestone_created',
      'Создан контрольный этап',
      new.title,
      jsonb_build_object('milestone_id', new.id, 'due_date', new.due_date)
    );
    return new;
  end if;

  if tg_table_name = 'project_milestones' and tg_op = 'UPDATE'
     and old.status is distinct from new.status
     and new.status = 'completed' then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata
    ) values (
      new.project_id,
      auth.uid(),
      'milestone_completed',
      'Контрольный этап достигнут',
      new.title,
      jsonb_build_object('milestone_id', new.id, 'completed_at', new.completed_at)
    );
    return new;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists project_timelines_activity_insert on public.project_timelines;
create trigger project_timelines_activity_insert
after insert on public.project_timelines
for each row execute function public.log_timeline_activity();

drop trigger if exists project_timelines_activity_status on public.project_timelines;
create trigger project_timelines_activity_status
after update of status on public.project_timelines
for each row execute function public.log_timeline_activity();

drop trigger if exists project_milestones_activity_insert on public.project_milestones;
create trigger project_milestones_activity_insert
after insert on public.project_milestones
for each row execute function public.log_timeline_activity();

drop trigger if exists project_milestones_activity_complete on public.project_milestones;
create trigger project_milestones_activity_complete
after update of status on public.project_milestones
for each row execute function public.log_timeline_activity();
