create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 200),
  conversation_type text not null default 'general'
    check (conversation_type in ('general', 'task', 'document', 'timeline', 'milestone')),
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'member', 'observer')),
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (char_length(trim(body)) between 1 and 10000),
  status text not null default 'active'
    check (status in ('active', 'edited', 'deleted')),
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  attachment_kind text not null
    check (attachment_kind in ('document', 'task', 'timeline', 'milestone')),
  linked_entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (message_id, attachment_kind, linked_entity_id)
);

create index if not exists conversations_project_updated_idx
  on public.conversations(project_id, updated_at desc);

create index if not exists conversation_participants_user_idx
  on public.conversation_participants(user_id, joined_at desc);

create index if not exists messages_conversation_created_idx
  on public.messages(conversation_id, created_at asc);

create index if not exists message_attachments_message_idx
  on public.message_attachments(message_id);

create or replace function public.is_project_participant(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = p_project_id
      and (
        projects.owner_id = auth.uid()
        or companies.owner_id = auth.uid()
      )
  );
$$;

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;

drop policy if exists "Project participants read conversations" on public.conversations;
create policy "Project participants read conversations"
on public.conversations for select to authenticated
using (public.is_project_participant(project_id));

drop policy if exists "Project participants create conversations" on public.conversations;
create policy "Project participants create conversations"
on public.conversations for insert to authenticated
with check (
  created_by = auth.uid()
  and public.is_project_participant(project_id)
);

drop policy if exists "Conversation creators update conversations" on public.conversations;
create policy "Conversation creators update conversations"
on public.conversations for update to authenticated
using (created_by = auth.uid() and public.is_project_participant(project_id))
with check (created_by = auth.uid() and public.is_project_participant(project_id));

drop policy if exists "Project participants read conversation participants" on public.conversation_participants;
create policy "Project participants read conversation participants"
on public.conversation_participants for select to authenticated
using (
  exists (
    select 1 from public.conversations
    where conversations.id = conversation_participants.conversation_id
      and public.is_project_participant(conversations.project_id)
  )
);

drop policy if exists "Conversation creators add participants" on public.conversation_participants;
create policy "Conversation creators add participants"
on public.conversation_participants for insert to authenticated
with check (
  exists (
    select 1 from public.conversations
    where conversations.id = conversation_participants.conversation_id
      and conversations.created_by = auth.uid()
      and public.is_project_participant(conversations.project_id)
  )
);

drop policy if exists "Project participants read messages" on public.messages;
create policy "Project participants read messages"
on public.messages for select to authenticated
using (
  exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
      and public.is_project_participant(conversations.project_id)
  )
);

drop policy if exists "Project participants create messages" on public.messages;
create policy "Project participants create messages"
on public.messages for insert to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
      and conversations.status = 'active'
      and public.is_project_participant(conversations.project_id)
  )
);

drop policy if exists "Authors update own messages" on public.messages;
create policy "Authors update own messages"
on public.messages for update to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists "Project participants read message attachments" on public.message_attachments;
create policy "Project participants read message attachments"
on public.message_attachments for select to authenticated
using (
  exists (
    select 1
    from public.messages
    join public.conversations on conversations.id = messages.conversation_id
    where messages.id = message_attachments.message_id
      and public.is_project_participant(conversations.project_id)
  )
);

drop policy if exists "Message authors add attachments" on public.message_attachments;
create policy "Message authors add attachments"
on public.message_attachments for insert to authenticated
with check (
  exists (
    select 1 from public.messages
    where messages.id = message_attachments.message_id
      and messages.author_id = auth.uid()
  )
);

create or replace function public.set_communication_updated_at()
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

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_communication_updated_at();

drop trigger if exists messages_set_updated_at on public.messages;
create trigger messages_set_updated_at
before update on public.messages
for each row execute function public.set_communication_updated_at();

create or replace function public.add_conversation_creator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.conversation_participants (conversation_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists conversations_add_creator on public.conversations;
create trigger conversations_add_creator
after insert on public.conversations
for each row execute function public.add_conversation_creator();

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
    'milestone_completed',
    'conversation_created',
    'message_created'
  ));

create or replace function public.log_communication_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_project_id uuid;
  conversation_title text;
begin
  if tg_table_name = 'conversations' and tg_op = 'INSERT' then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata, source_key
    ) values (
      new.project_id,
      auth.uid(),
      'conversation_created',
      'Создан диалог',
      new.title,
      jsonb_build_object('conversation_id', new.id, 'conversation_type', new.conversation_type),
      'conversation:' || new.id::text || ':created'
    ) on conflict do nothing;
    return new;
  end if;

  if tg_table_name = 'messages' and tg_op = 'INSERT' then
    select conversations.project_id, conversations.title
    into target_project_id, conversation_title
    from public.conversations
    where conversations.id = new.conversation_id;

    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata, source_key
    ) values (
      target_project_id,
      auth.uid(),
      'message_created',
      'Новое сообщение',
      conversation_title,
      jsonb_build_object('conversation_id', new.conversation_id, 'message_id', new.id),
      'message:' || new.id::text || ':created'
    ) on conflict do nothing;

    update public.conversations
    set updated_at = new.created_at
    where id = new.conversation_id;

    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists conversations_activity_created on public.conversations;
create trigger conversations_activity_created
after insert on public.conversations
for each row execute function public.log_communication_activity();

drop trigger if exists messages_activity_created on public.messages;
create trigger messages_activity_created
after insert on public.messages
for each row execute function public.log_communication_activity();
