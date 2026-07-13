#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p database/migrations services types engineering/operations

cat > types/project-activity.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export type ProjectActivityType =
  | "project_created"
  | "project_status_changed"
  | "task_created"
  | "task_status_changed";

export interface ProjectActivity {
  id: EntityId;
  project_id: EntityId;
  actor_id: EntityId | null;
  event_type: ProjectActivityType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  source_key: string | null;
  created_at: IsoDateTime;
}
EOF

python3 - <<'PY'
from pathlib import Path
path = Path("types/index.ts")
text = path.read_text(encoding="utf-8")
line = 'export * from "./project-activity";\n'
if line not in text:
    text += ("\n" if text and not text.endswith("\n") else "") + line
path.write_text(text, encoding="utf-8")
PY

cat > services/projectActivities.ts <<'EOF'
import { supabase } from "@/services/supabase";
import type { ProjectActivity } from "@/types/project-activity";

export async function getProjectActivities(projectId: string) {
  return await supabase
    .from("project_activities")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<ProjectActivity[]>();
}
EOF

cat > database/migrations/20260713_006_create_project_activities.sql <<'EOF'
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
EOF

cat > 'app/projects/[id]/page.tsx' <<'EOF'
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getProjectActivities } from "@/services/projectActivities";
import { getProjectWorkspace } from "@/services/projects";
import type { ProjectActivity } from "@/types/project-activity";
import type { ProjectStatus, ProjectWorkspace } from "@/types/project";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Черновик",
  published: "Опубликован",
  active: "Активен",
  in_progress: "В работе",
  completed: "Завершён",
  cancelled: "Отменён",
  archived: "В архиве",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("ru-RU");
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [project, setProject] = useState<ProjectWorkspace | null>(null);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([
      getProjectWorkspace(projectId),
      getProjectActivities(projectId),
    ]).then(([projectResult, activityResult]) => {
      if (!active) return;

      if (projectResult.error || !projectResult.data) {
        setError(projectResult.error?.message ?? "Проект не найден.");
        setProject(null);
      } else {
        setProject(projectResult.data);
        setError(null);
      }

      if (!activityResult.error && activityResult.data) {
        setActivities(activityResult.data);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [projectId]);

  if (loading) return <main className="p-8">Загрузка рабочего пространства...</main>;

  if (error || !project) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <div className="rounded-xl border bg-white p-6 shadow">
          <h1 className="text-2xl font-bold">Проект не найден</h1>
          <p className="mt-3 text-gray-600">{error ?? "Проект недоступен."}</p>
          <Link href="/projects" className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-white">
            Вернуться к проектам
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">
                Execution Workspace (рабочее пространство выполнения)
              </p>
              <h1 className="mt-2 text-3xl font-bold">{project.title}</h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                {project.description || project.request?.description || "Описание проекта пока не добавлено."}
              </p>
            </div>
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
              {STATUS_LABELS[project.status]}
            </span>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Исполнитель</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{project.company?.name ?? "Компания не определена"}</h2>
            <p className="mt-2 text-sm text-slate-600">{project.company?.city ?? "Город не указан"}</p>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Стоимость</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              {project.accepted_offer ? `${project.accepted_offer.price.toLocaleString("ru-RU")} ₽` : "Не определена"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {project.accepted_offer?.proposed_days ? `Срок: ${project.accepted_offer.proposed_days} дн.` : "Срок не указан"}
            </p>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Исходная заявка</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{project.request?.title ?? "Заявка не связана"}</h2>
            <p className="mt-2 text-sm text-slate-600">{project.request?.city ?? "Город не указан"}</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <article className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Управление выполнением</h2>
              <p className="mt-1 text-sm text-slate-600">Основные рабочие модули проекта собраны в одном месте.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Link href={`/projects/${project.id}/tasks`} className="rounded-xl border border-sky-200 bg-sky-50 p-5 transition hover:shadow-md">
                  <h3 className="font-semibold text-sky-950">Задачи и этапы</h3>
                  <p className="mt-2 text-sm text-sky-900">Планирование, статусы и контроль выполнения работ.</p>
                </Link>
                <Link href={`/projects/${project.id}/docs`} className="rounded-xl border border-amber-200 bg-amber-50 p-5 transition hover:shadow-md">
                  <h3 className="font-semibold text-amber-950">Документы</h3>
                  <p className="mt-2 text-sm text-amber-900">Рабочие материалы и документы проекта.</p>
                </Link>
                <Link href={`/projects/${project.id}/governance`} className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 transition hover:shadow-md">
                  <h3 className="font-semibold text-emerald-950">Контроль проекта</h3>
                  <p className="mt-2 text-sm text-emerald-900">Правила, решения и контрольные точки выполнения.</p>
                </Link>
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                  <h3 className="font-semibold text-slate-900">Чат проекта</h3>
                  <p className="mt-2 text-sm text-slate-600">Следующий самостоятельный модуль.</p>
                </div>
              </div>
            </article>

            {project.accepted_offer?.message && (
              <article className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Условия предложения</h2>
                <p className="mt-4 whitespace-pre-wrap text-slate-700">{project.accepted_offer.message}</p>
              </article>
            )}
          </div>

          <aside className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Activity Feed (лента активности)</h2>
            {activities.length === 0 ? (
              <p className="mt-5 text-sm text-slate-600">События появятся после применения миграции и начала работы с проектом.</p>
            ) : (
              <div className="mt-5 space-y-5">
                {activities.map((item) => (
                  <div key={item.id} className="border-l-2 border-sky-200 pl-4">
                    <h3 className="font-medium text-slate-900">{item.title}</h3>
                    {item.description && <p className="mt-1 text-sm text-slate-600">{item.description}</p>}
                    <p className="mt-2 text-xs text-slate-400">{formatDate(item.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </section>

        <div className="flex flex-wrap gap-4">
          {project.request_id && <Link href={`/requests/${project.request_id}`} className="text-blue-700 hover:underline">← Вернуться к заявке</Link>}
          <Link href="/projects" className="text-blue-700 hover:underline">Все проекты</Link>
        </div>
      </div>
    </main>
  );
}
EOF

cat > engineering/operations/OP-013-project-activity-engine.md <<'EOF'
# OP-013 — Project Activity Engine

Статус: Implementation

## Goal

Создать единый неизменяемый журнал событий проекта для рабочего пространства, задач, будущих документов и уведомлений.

## Scope

- таблица `project_activities`;
- RLS для заказчика и владельца компании-исполнителя;
- автоматические события проекта и задач;
- типы и сервис чтения;
- Activity Feed в рабочем пространстве;
- восстановление события создания для существующих проектов.

## Definition of Done

- миграция подготовлена и применена;
- Lint, TypeScript и Build успешны;
- лента показывает события;
- создание задачи и смена статуса создают записи;
- изменения зафиксированы в Git.
EOF

python3 - <<'PY'
from pathlib import Path
sprint = Path("engineering/sprints/CURRENT_SPRINT.md")
text = sprint.read_text(encoding="utf-8")
text = text.replace("- OP-012 Task Board and execution workflow.", "- OP-012 Project Execution Workspace — completed.\n- OP-013 Project Activity Engine — in progress.")
sprint.write_text(text, encoding="utf-8")

log = Path("engineering/daily/SESSION_LOG.md")
text = log.read_text(encoding="utf-8")
entry = "\n## 2026-07-13 — OP-013 started\n\n- Подготовлен Project Activity Engine.\n- Добавлены типы, сервис, миграция, RLS и автоматические события.\n- Рабочее пространство переведено на реальную ленту активности.\n"
if "OP-013 started" not in text:
    text += entry
log.write_text(text, encoding="utf-8")
PY

echo "created: types/project-activity.ts"
echo "updated: types/index.ts"
echo "created: services/projectActivities.ts"
echo "created: database/migrations/20260713_006_create_project_activities.sql"
echo "updated: app/projects/[id]/page.tsx"
echo "updated: engineering records"
