#!/usr/bin/env bash
set -Eeuo pipefail

mkdir -p \
  database/migrations \
  services \
  types \
  'app/projects/[id]/communication' \
  engineering/operations \
  engineering/knowledge/glossary \
  engineering/playbook

cat > types/conversation.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export type ConversationType =
  | "general"
  | "task"
  | "document"
  | "timeline"
  | "milestone";

export type ConversationStatus = "active" | "archived";
export type ConversationParticipantRole = "owner" | "member" | "observer";

export interface Conversation {
  id: EntityId;
  project_id: EntityId;
  title: string;
  conversation_type: ConversationType;
  status: ConversationStatus;
  created_by: EntityId;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface ConversationParticipant {
  conversation_id: EntityId;
  user_id: EntityId;
  role: ConversationParticipantRole;
  joined_at: IsoDateTime;
}
EOF

cat > types/message.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export type MessageStatus = "active" | "edited" | "deleted";
export type MessageAttachmentKind = "document" | "task" | "timeline" | "milestone";

export interface ProjectMessage {
  id: EntityId;
  conversation_id: EntityId;
  author_id: EntityId;
  body: string;
  status: MessageStatus;
  edited_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface MessageAttachment {
  id: EntityId;
  message_id: EntityId;
  attachment_kind: MessageAttachmentKind;
  linked_entity_id: EntityId;
  created_at: IsoDateTime;
}
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("types/index.ts")
text = path.read_text(encoding="utf-8")
for line in (
    'export * from "./conversation";\n',
    'export * from "./message";\n',
):
    if line not in text:
        text = text.rstrip() + "\n" + line
path.write_text(text, encoding="utf-8")

activity_path = Path("types/project-activity.ts")
activity = activity_path.read_text(encoding="utf-8")
needle = '  | "milestone_completed";'
replacement = '  | "milestone_completed"\n  | "conversation_created"\n  | "message_created";'
if needle in activity:
    activity = activity.replace(needle, replacement, 1)
elif '  | "message_created";' not in activity:
    raise SystemExit("Не найден ожидаемый блок ProjectActivityType")
activity_path.write_text(activity, encoding="utf-8")
PY

cat > services/conversations.ts <<'EOF'
import { supabase } from "@/services/supabase";
import type { Conversation, ConversationType } from "@/types/conversation";

export async function listProjectConversations(projectId: string) {
  return await supabase
    .from("conversations")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .returns<Conversation[]>();
}

export async function createProjectConversation(input: {
  project_id: string;
  title: string;
  conversation_type?: ConversationType;
}) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { data: null, error: authError ?? new Error("Пользователь не авторизован.") };
  }

  return await supabase
    .from("conversations")
    .insert({
      project_id: input.project_id,
      title: input.title.trim(),
      conversation_type: input.conversation_type ?? "general",
      created_by: authData.user.id,
    })
    .select("*")
    .single<Conversation>();
}
EOF

cat > services/messages.ts <<'EOF'
import { supabase } from "@/services/supabase";
import type { ProjectMessage } from "@/types/message";

export async function listConversationMessages(conversationId: string) {
  return await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .neq("status", "deleted")
    .order("created_at", { ascending: true })
    .returns<ProjectMessage[]>();
}

export async function sendConversationMessage(input: {
  conversation_id: string;
  body: string;
}) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { data: null, error: authError ?? new Error("Пользователь не авторизован.") };
  }

  return await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversation_id,
      author_id: authData.user.id,
      body: input.body.trim(),
    })
    .select("*")
    .single<ProjectMessage>();
}
EOF

cat > database/migrations/20260714_011_create_project_communication.sql <<'EOF'
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
EOF

cat > 'app/projects/[id]/communication/page.tsx' <<'EOF'
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  createProjectConversation,
  listProjectConversations,
} from "@/services/conversations";
import {
  listConversationMessages,
  sendConversationMessage,
} from "@/services/messages";
import type { Conversation } from "@/types/conversation";
import type { ProjectMessage } from "@/types/message";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("ru-RU");
}

export default function ProjectCommunicationPage() {
  const params = useParams<{ id: string | string[] }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [conversationTitle, setConversationTitle] = useState("Общий диалог проекта");
  const [messageBody, setMessageBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void listProjectConversations(projectId).then(({ data, error: loadError }) => {
      if (!active) return;

      if (loadError) {
        setError(loadError.message);
        setConversations([]);
      } else {
        const loaded = data ?? [];
        setConversations(loaded);
        setSelectedConversationId(loaded[0]?.id ?? null);
        setError(null);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [projectId]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    let active = true;

    void listConversationMessages(selectedConversationId).then(({ data, error: loadError }) => {
      if (!active) return;

      if (loadError) {
        setError(loadError.message);
        setMessages([]);
      } else {
        setMessages(data ?? []);
        setError(null);
      }
    });

    return () => {
      active = false;
    };
  }, [selectedConversationId]);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  async function handleCreateConversation() {
    const title = conversationTitle.trim();
    if (!title || saving) return;

    setSaving(true);
    setError(null);

    const { data, error: createError } = await createProjectConversation({
      project_id: projectId,
      title,
      conversation_type: "general",
    });

    if (createError || !data) {
      setError(createError?.message ?? "Не удалось создать диалог.");
    } else {
      setConversations((current) => [data, ...current]);
      setSelectedConversationId(data.id);
      setConversationTitle("");
      setMessages([]);
    }

    setSaving(false);
  }

  async function handleSendMessage() {
    const body = messageBody.trim();
    if (!selectedConversationId || !body || saving) return;

    setSaving(true);
    setError(null);

    const { data, error: sendError } = await sendConversationMessage({
      conversation_id: selectedConversationId,
      body,
    });

    if (sendError || !data) {
      setError(sendError?.message ?? "Не удалось отправить сообщение.");
    } else {
      setMessages((current) => [...current, data]);
      setMessageBody("");
    }

    setSaving(false);
  }

  if (loading) {
    return <main className="p-8">Загрузка коммуникаций проекта...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">
            Project Communication Platform (платформа коммуникаций проекта)
          </p>
          <h1 className="mt-2 text-3xl font-bold">Диалоги проекта</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Общение участников, история сообщений и будущая связь с задачами, документами и этапами.
          </p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Conversation (диалог)</h2>
              <p className="mt-1 text-sm text-slate-600">Создай общий или тематический диалог.</p>
            </div>

            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={conversationTitle}
              onChange={(event) => setConversationTitle(event.target.value)}
              placeholder="Название диалога"
            />
            <button
              type="button"
              className="w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-50"
              disabled={saving || !conversationTitle.trim()}
              onClick={() => void handleCreateConversation()}
            >
              Создать диалог
            </button>

            <div className="space-y-2 border-t border-slate-200 pt-4">
              {conversations.length === 0 ? (
                <p className="text-sm text-slate-500">Диалогов пока нет.</p>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      selectedConversationId === conversation.id
                        ? "border-sky-300 bg-sky-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                    onClick={() => setSelectedConversationId(conversation.id)}
                  >
                    <span className="block font-medium text-slate-900">{conversation.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {formatDate(conversation.updated_at)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="flex min-h-[560px] flex-col rounded-2xl bg-white p-5 shadow-sm">
            {selectedConversation ? (
              <>
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-xl font-semibold text-slate-900">{selectedConversation.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Thread (ветка обсуждения) — последовательность сообщений внутри диалога.
                  </p>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto py-5">
                  {messages.length === 0 ? (
                    <p className="text-sm text-slate-500">Сообщений пока нет. Начни обсуждение.</p>
                  ) : (
                    messages.map((message) => (
                      <article key={message.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="whitespace-pre-wrap text-slate-800">{message.body}</p>
                        <p className="mt-2 text-xs text-slate-400">{formatDate(message.created_at)}</p>
                      </article>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <textarea
                    className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={messageBody}
                    onChange={(event) => setMessageBody(event.target.value)}
                    placeholder="Напиши сообщение участникам проекта"
                  />
                  <button
                    type="button"
                    className="mt-3 rounded-lg bg-sky-700 px-5 py-2 font-medium text-white disabled:opacity-50"
                    disabled={saving || !messageBody.trim()}
                    onClick={() => void handleSendMessage()}
                  >
                    Отправить сообщение
                  </button>
                </div>
              </>
            ) : (
              <div className="m-auto max-w-md text-center">
                <h2 className="text-xl font-semibold text-slate-900">Создай первый диалог</h2>
                <p className="mt-2 text-sm text-slate-600">
                  После создания здесь появится история сообщений проекта.
                </p>
              </div>
            )}
          </section>
        </section>

        <Link href={`/projects/${projectId}`} className="inline-block text-blue-700 hover:underline">
          ← Вернуться в рабочее пространство проекта
        </Link>
      </div>
    </main>
  );
}
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("app/projects/[id]/page.tsx")
text = path.read_text(encoding="utf-8")
old = '''                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                  <h3 className="font-semibold text-slate-900">Чат проекта</h3>
                  <p className="mt-2 text-sm text-slate-600">Следующий самостоятельный модуль.</p>
                </div>'''
new = '''                <Link href={`/projects/${project.id}/communication`} className="rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-5 transition hover:shadow-md">
                  <h3 className="font-semibold text-fuchsia-950">Коммуникации проекта</h3>
                  <p className="mt-2 text-sm text-fuchsia-900">Диалоги, сообщения и обсуждение рабочих объектов.</p>
                </Link>'''
if old not in text:
    if '/communication`}' not in text:
        raise SystemExit("Не найден ожидаемый блок чата в странице проекта")
else:
    text = text.replace(old, new, 1)
path.write_text(text, encoding="utf-8")
PY

cat > engineering/operations/OP-018-project-communication-platform.md <<'EOF'
# OP-018 — Project Communication Platform (Платформа коммуникаций проекта)

## Status (статус)

Implementation (реализация).

## Goal (цель)

Завершить Capability C-001 Project Collaboration (возможность совместной работы над проектом), добавив диалоги и сообщения внутри проекта.

## Scope (состав)

- Conversation (диалог).
- Participant (участник).
- Message (сообщение).
- Message Attachment (вложение сообщения).
- RLS — Row-Level Security (разграничение доступа на уровне строк).
- Activity и Notification integration (интеграция с активностью и уведомлениями).

## Definition of Done (критерии завершения)

- Миграция применена в Supabase.
- Созданы четыре таблицы коммуникаций.
- Пользователь может создать диалог и отправить сообщение.
- События `conversation_created` и `message_created` попадают в `project_activities`.
- Уведомления создаются существующим Notifications Engine (движком уведомлений).
- ESLint, TypeScript и Build проходят успешно.
EOF

cat > engineering/knowledge/glossary/OP-018-communication-terms.md <<'EOF'
# OP-018 — Communication Terms (термины коммуникаций)

## Conversation (диалог)

Контейнер общения по общей или тематической части проекта.

## Thread (ветка обсуждения)

Последовательность сообщений внутри одного диалога.

## Participant (участник)

Пользователь, имеющий доступ к диалогу и определённую роль.

## Message (сообщение)

Текстовая единица общения, созданная автором внутри диалога.

## Attachment (вложение)

Связь сообщения с документом, задачей, временной шкалой или контрольным этапом.

## Communication Platform (платформа коммуникаций)

Подсистема, объединяющая диалоги, участников, сообщения, вложения, события и уведомления.
EOF

cat > engineering/playbook/README.md <<'EOF'
# Engineering Playbook (Инженерный свод правил)

Практические правила разработки SPEC76 и будущего Enterprise Core (общего инженерного ядра).

## Development Flow (поток разработки)

Vision → Release → Capability → OP → Implementation → Quality Gate → Release Review.

## Mandatory Rules (обязательные правила)

1. Architecture Readiness Check (проверка архитектурной готовности) выполняется до реализации.
2. Platform First (сначала платформа): повторно используемые возможности проектируются как сервисы платформы.
3. Bilingual Engineering (двуязычная инженерная среда): новые термины сопровождаются русским переводом.
4. Canonical Model (каноническая модель): сущность имеет идентификатор, жизненный цикл, владельца, события, права, аудит и связи.
5. Event-Driven Architecture (событийно-ориентированная архитектура): интеграция по возможности строится через события.
6. Quality Gate (контроль качества): ESLint, TypeScript, Build, Migration, Supabase Check и Git.
7. Single Source of Truth (единый источник истины): GitHub для кода, Engineering OS для решений, Supabase для рабочих данных.
EOF

python3 - <<'PY'
from pathlib import Path

sprint = Path("engineering/sprints/CURRENT_SPRINT.md")
text = sprint.read_text(encoding="utf-8")
text = text.replace("- OP-016 Timeline & Milestones.\n", "- OP-016 Timeline & Milestones.\n- OP-017 Notifications Engine.\n")
text = text.replace("- OP-016 Timeline & Milestones.\n\n## Next", "- OP-018 Project Communication Platform.\n\n## Next")
text = text.replace("- OP-017 Notifications Engine.\n- OP-018 Project Chat.\n", "- Release Review 0.3.\n")
if "- OP-018 Project Communication Platform." not in text:
    text = text.replace("## In Progress\n", "## In Progress\n\n- OP-018 Project Communication Platform.\n")
sprint.write_text(text, encoding="utf-8")

session = Path("engineering/daily/SESSION_LOG.md")
entry = """

## 2026-07-14 — OP-018 Project Communication Platform

- Подготовлена модель Conversation, Participant, Message и Attachment.
- Добавлена интеграция с Activity Engine и Notifications Engine.
- Создан Engineering Playbook (Инженерный свод правил).
- Следующий контрольный этап: Release Review 0.3.
"""
text = session.read_text(encoding="utf-8")
if "## 2026-07-14 — OP-018 Project Communication Platform" not in text:
    session.write_text(text.rstrip() + entry + "\n", encoding="utf-8")
PY

echo "OP-018 Project Communication Platform files created"
