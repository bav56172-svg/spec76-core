create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete restrict,
  document_type text not null default 'other'
    check (document_type in ('contract', 'estimate', 'act', 'invoice', 'photo', 'technical', 'other')),
  title text not null check (char_length(trim(title)) between 2 and 200),
  description text,
  status text not null default 'active'
    check (status in ('draft', 'active', 'archived')),
  current_version integer not null default 0 check (current_version >= 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  storage_path text not null,
  file_name text not null check (char_length(trim(file_name)) between 1 and 255),
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  checksum text,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create index if not exists documents_project_created_idx
  on public.documents(project_id, created_at desc);

create index if not exists documents_task_idx
  on public.documents(task_id)
  where task_id is not null;

create index if not exists documents_status_idx
  on public.documents(project_id, status);

create index if not exists document_versions_document_idx
  on public.document_versions(document_id, version_number desc);

create or replace function public.set_document_updated_at()
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

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_document_updated_at();

alter table public.documents enable row level security;
alter table public.document_versions enable row level security;

drop policy if exists "Project participants read documents" on public.documents;
create policy "Project participants read documents"
on public.documents for select to authenticated
using (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = documents.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

drop policy if exists "Project participants create documents" on public.documents;
create policy "Project participants create documents"
on public.documents for insert to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = documents.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

drop policy if exists "Project participants update documents" on public.documents;
create policy "Project participants update documents"
on public.documents for update to authenticated
using (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = documents.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = documents.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

drop policy if exists "Project participants read document versions" on public.document_versions;
create policy "Project participants read document versions"
on public.document_versions for select to authenticated
using (
  exists (
    select 1
    from public.documents
    join public.projects on projects.id = documents.project_id
    left join public.companies on companies.id = projects.company_id
    where documents.id = document_versions.document_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

drop policy if exists "Project participants create document versions" on public.document_versions;
create policy "Project participants create document versions"
on public.document_versions for insert to authenticated
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.documents
    join public.projects on projects.id = documents.project_id
    left join public.companies on companies.id = projects.company_id
    where documents.id = document_versions.document_id
      and documents.status <> 'archived'
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

create or replace function public.create_document_version(
  p_document_id uuid,
  p_storage_path text,
  p_file_name text,
  p_mime_type text default null,
  p_size_bytes bigint default null,
  p_checksum text default null
)
returns public.document_versions
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_version integer;
  created_version public.document_versions;
begin
  select current_version + 1
  into next_version
  from public.documents
  where id = p_document_id
    and status <> 'archived'
  for update;

  if next_version is null then
    raise exception 'Document is unavailable for version creation';
  end if;

  insert into public.document_versions (
    document_id,
    version_number,
    storage_path,
    file_name,
    mime_type,
    size_bytes,
    checksum,
    uploaded_by
  ) values (
    p_document_id,
    next_version,
    p_storage_path,
    p_file_name,
    p_mime_type,
    p_size_bytes,
    p_checksum,
    auth.uid()
  )
  returning * into created_version;

  update public.documents
  set current_version = next_version,
      status = 'active'
  where id = p_document_id;

  return created_version;
end;
$$;

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
    'document_version_created'
  ));

create or replace function public.log_document_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'documents' and tg_op = 'INSERT' then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata
    ) values (
      new.project_id,
      auth.uid(),
      'document_created',
      'Создан документ',
      new.title,
      jsonb_build_object('document_id', new.id, 'document_type', new.document_type)
    );
    return new;
  end if;

  if tg_table_name = 'documents' and tg_op = 'UPDATE'
     and old.status is distinct from new.status
     and new.status = 'archived' then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata
    ) values (
      new.project_id,
      auth.uid(),
      'document_archived',
      'Документ архивирован',
      new.title,
      jsonb_build_object('document_id', new.id)
    );
    return new;
  end if;

  if tg_table_name = 'document_versions' and tg_op = 'INSERT' then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata
    )
    select
      documents.project_id,
      auth.uid(),
      'document_version_created',
      'Добавлена версия документа',
      new.file_name,
      jsonb_build_object(
        'document_id', new.document_id,
        'version_id', new.id,
        'version_number', new.version_number
      )
    from public.documents
    where documents.id = new.document_id;
    return new;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists documents_activity_created on public.documents;
create trigger documents_activity_created
after insert on public.documents
for each row execute function public.log_document_activity();

drop trigger if exists documents_activity_archived on public.documents;
create trigger documents_activity_archived
after update of status on public.documents
for each row execute function public.log_document_activity();

drop trigger if exists document_versions_activity_created on public.document_versions;
create trigger document_versions_activity_created
after insert on public.document_versions
for each row execute function public.log_document_activity();
