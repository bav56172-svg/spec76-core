create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  assignee_id uuid references auth.users(id) on delete set null,
  title text not null check (char_length(trim(title)) between 2 and 200),
  description text,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'review', 'done', 'cancelled')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  due_at timestamptz,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_project_position_idx
  on public.tasks(project_id, position, created_at);

create index if not exists tasks_project_status_idx
  on public.tasks(project_id, status, created_at desc);

create index if not exists tasks_assignee_idx
  on public.tasks(assignee_id)
  where assignee_id is not null;

alter table public.tasks enable row level security;

drop policy if exists "Project participants read tasks" on public.tasks;
create policy "Project participants read tasks"
on public.tasks for select to authenticated
using (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = tasks.project_id
      and (
        projects.owner_id = auth.uid()
        or companies.owner_id = auth.uid()
      )
  )
);

drop policy if exists "Project participants create tasks" on public.tasks;
create policy "Project participants create tasks"
on public.tasks for insert to authenticated
with check (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = tasks.project_id
      and (
        projects.owner_id = auth.uid()
        or companies.owner_id = auth.uid()
      )
  )
);

drop policy if exists "Project participants update tasks" on public.tasks;
create policy "Project participants update tasks"
on public.tasks for update to authenticated
using (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = tasks.project_id
      and (
        projects.owner_id = auth.uid()
        or companies.owner_id = auth.uid()
      )
  )
)
with check (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = tasks.project_id
      and (
        projects.owner_id = auth.uid()
        or companies.owner_id = auth.uid()
      )
  )
);

drop policy if exists "Project participants delete tasks" on public.tasks;
create policy "Project participants delete tasks"
on public.tasks for delete to authenticated
using (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = tasks.project_id
      and (
        projects.owner_id = auth.uid()
        or companies.owner_id = auth.uid()
      )
  )
);

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

do $$
begin
  if to_regprocedure('public.log_project_activity()') is not null then
    drop trigger if exists tasks_activity_created on public.tasks;
    create trigger tasks_activity_created
    after insert on public.tasks
    for each row execute function public.log_project_activity();

    drop trigger if exists tasks_activity_status on public.tasks;
    create trigger tasks_activity_status
    after update of status on public.tasks
    for each row execute function public.log_project_activity();
  end if;
end
$$;
