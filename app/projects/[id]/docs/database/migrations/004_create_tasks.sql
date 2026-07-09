create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  description text,

  status text not null default 'todo',

  project_id uuid not null references projects(id) on delete cascade,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);