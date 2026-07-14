#!/usr/bin/env bash
set -Eeuo pipefail

mkdir -p \
  database/migrations \
  services \
  types \
  'app/projects/[id]/notifications' \
  engineering/operations \
  engineering/knowledge/glossary

cat > types/notification.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export type NotificationChannel = "in_app";
export type NotificationStatus = "unread" | "read" | "archived";

export interface Notification {
  id: EntityId;
  user_id: EntityId;
  project_id: EntityId | null;
  activity_id: EntityId | null;
  event_type: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  message: string | null;
  read_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface NotificationSummary {
  total: number;
  unread: number;
}
EOF

python3 - <<'PY'
from pathlib import Path
path = Path("types/index.ts")
text = path.read_text(encoding="utf-8")
line = 'export * from "./notification";\n'
if line not in text:
    path.write_text(text.rstrip() + "\n" + line, encoding="utf-8")
PY

cat > services/notifications.ts <<'EOF'
import { supabase } from "@/services/supabase";
import type { Notification } from "@/types/notification";

export async function listProjectNotifications(projectId: string) {
  return await supabase
    .from("notifications")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<Notification[]>();
}

export async function markNotificationAsRead(id: string) {
  return await supabase
    .from("notifications")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single<Notification>();
}

export async function markAllProjectNotificationsAsRead(projectId: string) {
  return await supabase
    .from("notifications")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("status", "unread")
    .select("*")
    .returns<Notification[]>();
}
EOF

cat > database/migrations/20260714_010_create_notifications.sql <<'EOF'
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
EOF

cat > 'app/projects/[id]/notifications/page.tsx' <<'EOF'
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  listProjectNotifications,
  markAllProjectNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notifications";
import type { Notification } from "@/types/notification";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("ru-RU");
}

export default function ProjectNotificationsPage() {
  const params = useParams<{ id: string | string[] }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void listProjectNotifications(projectId).then(({ data, error: loadError }) => {
      if (!active) return;

      if (loadError) {
        setError(loadError.message);
        setNotifications([]);
      } else {
        setNotifications(data ?? []);
        setError(null);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [projectId]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.status === "unread").length,
    [notifications],
  );

  async function handleMarkAsRead(notification: Notification) {
    if (notification.status !== "unread") return;

    const previous = notifications;
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, status: "read", read_at: new Date().toISOString() }
          : item,
      ),
    );

    const { error: updateError } = await markNotificationAsRead(notification.id);
    if (updateError) {
      setNotifications(previous);
      setError(updateError.message);
    }
  }

  async function handleMarkAllAsRead() {
    if (saving || unreadCount === 0) return;

    setSaving(true);
    setError(null);

    const previous = notifications;
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((item) =>
        item.status === "unread" ? { ...item, status: "read", read_at: readAt } : item,
      ),
    );

    const { error: updateError } = await markAllProjectNotificationsAsRead(projectId);
    if (updateError) {
      setNotifications(previous);
      setError(updateError.message);
    }

    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">
            Notifications Engine (движок уведомлений)
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Уведомления проекта</h1>
              <p className="mt-2 text-slate-300">
                Важные события проекта, адресованные текущему пользователю.
              </p>
            </div>
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
              Непрочитано: {unreadCount}
            </span>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/projects/${projectId}`} className="text-blue-700 hover:underline">
            ← Вернуться в рабочее пространство
          </Link>
          <button
            type="button"
            onClick={() => void handleMarkAllAsRead()}
            disabled={saving || unreadCount === 0}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Сохраняем..." : "Отметить все прочитанными"}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p>Загрузка уведомлений...</p>
        ) : notifications.length === 0 ? (
          <section className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Уведомлений пока нет</h2>
            <p className="mt-2 text-slate-600">
              Они появятся после новых действий участников проекта.
            </p>
          </section>
        ) : (
          <section className="space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => void handleMarkAsRead(notification)}
                className={`w-full rounded-2xl border p-5 text-left shadow-sm transition hover:shadow-md ${
                  notification.status === "unread"
                    ? "border-sky-200 bg-sky-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">{notification.title}</h2>
                    {notification.message && (
                      <p className="mt-2 text-sm text-slate-600">{notification.message}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {notification.status === "unread" ? "Новое" : "Прочитано"}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  {notification.event_type} · {formatDate(notification.created_at)}
                </p>
              </button>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
EOF

python3 - <<'PY'
from pathlib import Path
path = Path("app/projects/[id]/page.tsx")
text = path.read_text(encoding="utf-8")
old = '''                <Link href={`/projects/${project.id}/governance`} className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 transition hover:shadow-md">
                  <h3 className="font-semibold text-emerald-950">Контроль проекта</h3>
                  <p className="mt-2 text-sm text-emerald-900">Правила, решения и контрольные точки выполнения.</p>
                </Link>
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
'''
new = '''                <Link href={`/projects/${project.id}/notifications`} className="rounded-xl border border-rose-200 bg-rose-50 p-5 transition hover:shadow-md">
                  <h3 className="font-semibold text-rose-950">Уведомления</h3>
                  <p className="mt-2 text-sm text-rose-900">Персональные сообщения о важных событиях проекта.</p>
                </Link>
                <Link href={`/projects/${project.id}/governance`} className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 transition hover:shadow-md">
                  <h3 className="font-semibold text-emerald-950">Контроль проекта</h3>
                  <p className="mt-2 text-sm text-emerald-900">Правила, решения и контрольные точки выполнения.</p>
                </Link>
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
'''
if old not in text:
    raise SystemExit("Не найден ожидаемый блок в app/projects/[id]/page.tsx")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
PY

cat > engineering/operations/OP-017-notifications-engine.md <<'EOF'
# OP-017 — Notifications Engine (движок уведомлений)

## Capability (возможность платформы)

C-001 Project Collaboration (совместная работа над проектом).

## Цель

Преобразовывать записи Activity Engine (движка активности) в персональные уведомления участников проекта.

## Архитектурное решение

Notifications Engine (движок уведомлений) не опрашивает бизнес-модули. Он получает новые записи через триггер на `project_activities`.

## Состав

- таблица `notifications`;
- RLS (разграничение доступа на уровне строк);
- автоматическое создание уведомлений для владельца проекта и владельца компании;
- сервис чтения и изменения статуса;
- страница уведомлений проекта;
- поддержка статусов unread/read/archived (непрочитано/прочитано/архивировано).

## Definition of Done (критерии завершения)

- миграция применяется без ошибок;
- пользователь видит только свои уведомления;
- новые события проекта создают уведомления другим участникам;
- уведомление можно отметить прочитанным;
- Lint, TypeScript и Build проходят успешно.
EOF

cat > engineering/knowledge/glossary/OP-017-notifications-terms.md <<'EOF'
# OP-017 — Инженерные термины

## Notification (уведомление)

Персональное сообщение пользователю о значимом событии системы.

## Recipient (получатель)

Пользователь, для которого создано уведомление.

## Unread (непрочитано)

Состояние уведомления, которое пользователь ещё не открыл.

## Read (прочитано)

Состояние уведомления после ознакомления пользователя.

## Subscription (подписка на события)

Механизм получения системой уведомлений новых событий без постоянного опроса источников.

## Fan-out (распределение события нескольким получателям)

Создание отдельных уведомлений нескольким участникам на основании одного события.
EOF

cat > engineering/sprints/CURRENT_SPRINT.md <<'EOF'
# Current Sprint (текущий спринт) — Release 0.3 Project Collaboration

## Goal (цель)

Реализовать Capability C-001 Project Collaboration (возможность совместной работы над проектом).

## Completed (завершено)

- OP-000 Engineering OS Foundation.
- OP-011 Execution Workspace Foundation.
- OP-012 Project Execution Workspace.
- OP-013 Project Activity Engine.
- OP-014 Task Engine.
- OP-015 Documents Engine.
- OP-016 Timeline & Milestones.

## In Progress (в работе)

- OP-017 Notifications Engine.

## Next (далее)

- OP-018 Project Chat.

## Blockers (блокеры)

Нет подтверждённых блокеров.
EOF

cat >> engineering/daily/SESSION_LOG.md <<'EOF'

## 2026-07-14 — OP-017 Notifications Engine

- Подготовлена модель персональных уведомлений.
- Добавлена событийная интеграция с `project_activities`.
- Добавлена страница уведомлений проекта.
- Добавлены RLS-политики и двуязычный словарь терминов.
EOF

echo "OP-017 Notifications Engine files created"
