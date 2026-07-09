alter table tasks enable row level security;

create policy "Users can view tasks of their projects"
on tasks for select
using (
  project_id in (
    select id from projects
    where company_id in (
      select id from companies
      where owner_id = auth.uid()
    )
  )
);

create policy "Users can create tasks"
on tasks for insert
with check (
  project_id in (
    select id from projects
    where company_id in (
      select id from companies
      where owner_id = auth.uid()
    )
  )
);

create policy "Users can update tasks"
on tasks for update
using (
  project_id in (
    select id from projects
    where company_id in (
      select id from companies
      where owner_id = auth.uid()
    )
  )
);