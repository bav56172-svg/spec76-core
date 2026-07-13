#!/usr/bin/env bash
set -Eeuo pipefail

mkdir -p \
  database/migrations \
  engineering/operations \
  engineering/sprints \
  engineering/daily

cat > database/migrations/20260713_007_create_tasks.sql <<'SQL'
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
SQL

cat > types/task.ts <<'TS'
import type { EntityId, IsoDateTime } from "./common";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "review"
  | "done"
  | "cancelled";

export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface Task {
  id: EntityId;
  project_id: EntityId;
  assignee_id: EntityId | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: IsoDateTime | null;
  position: number;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface TaskCreateInput {
  project_id: EntityId;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  due_at?: IsoDateTime | null;
  assignee_id?: EntityId | null;
  position?: number;
}
TS

cat > services/tasks.ts <<'TS'
import { supabase } from "@/services/supabase";
import type { Task, TaskCreateInput, TaskStatus } from "@/types/task";

export async function getTasks(projectId: string) {
  return await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<Task[]>();
}

export async function createTask(input: TaskCreateInput) {
  return await supabase
    .from("tasks")
    .insert({
      project_id: input.project_id,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? "normal",
      due_at: input.due_at ?? null,
      assignee_id: input.assignee_id ?? null,
      position: input.position ?? 0,
      status: "todo",
    })
    .select("*")
    .single<Task>();
}

export async function updateTask(
  id: string,
  updates: Partial<Pick<Task, "title" | "description" | "priority" | "due_at" | "assignee_id" | "position">>,
) {
  return await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single<Task>();
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  return await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single<Task>();
}

export async function deleteTask(id: string) {
  return await supabase.from("tasks").delete().eq("id", id);
}
TS

cat > app/projects/'[id]'/tasks/page.tsx <<'TSX'
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  createTask,
  getTasks,
  updateTaskStatus,
} from "@/services/tasks";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";
import TaskCard from "./components/TaskCard";

const columns: Array<{ status: TaskStatus; title: string }> = [
  { status: "todo", title: "Сделать" },
  { status: "in_progress", title: "В работе" },
  { status: "review", title: "Проверка" },
  { status: "done", title: "Готово" },
];

export default function TasksPage() {
  const params = useParams<{ id: string | string[] }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [dueAt, setDueAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getTasks(projectId).then(({ data, error: loadError }) => {
      if (!active) return;

      if (loadError) {
        setError(loadError.message);
        setTasks([]);
      } else {
        setTasks(data ?? []);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [projectId]);

  const groupedTasks = useMemo(() => {
    return columns.reduce<Record<TaskStatus, Task[]>>(
      (accumulator, column) => {
        accumulator[column.status] = tasks.filter(
          (task) => task.status === column.status,
        );
        return accumulator;
      },
      {
        todo: [],
        in_progress: [],
        review: [],
        done: [],
        cancelled: [],
      },
    );
  }, [tasks]);

  async function handleCreateTask() {
    const normalizedTitle = title.trim();
    if (!normalizedTitle || saving) return;

    setSaving(true);
    setError(null);

    const { data, error: createError } = await createTask({
      project_id: projectId,
      title: normalizedTitle,
      priority,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      position: tasks.length,
    });

    if (createError) {
      setError(createError.message);
    } else if (data) {
      setTasks((current) => [...current, data]);
      setTitle("");
      setPriority("normal");
      setDueAt("");
    }

    setSaving(false);
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    const previousTasks = tasks;

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, status } : task,
      ),
    );

    const { data, error: updateError } = await updateTaskStatus(taskId, status);

    if (updateError) {
      setTasks(previousTasks);
      setError(updateError.message);
    } else if (data) {
      setTasks((current) =>
        current.map((task) => (task.id === taskId ? data : task)),
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-blue-700 hover:underline"
        >
          ← К рабочему пространству
        </Link>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Task Engine (движок задач)
            </p>
            <h1 className="mt-1 text-3xl font-bold">Задачи проекта</h1>
          </div>
          <p className="text-sm text-slate-600">Всего задач: {tasks.length}</p>
        </div>

        <section className="mt-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_220px_auto]">
          <input
            className="rounded-lg border p-3"
            placeholder="Новая задача"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleCreateTask();
            }}
          />

          <select
            className="rounded-lg border p-3"
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
          >
            <option value="low">Низкий приоритет</option>
            <option value="normal">Обычный приоритет</option>
            <option value="high">Высокий приоритет</option>
            <option value="urgent">Срочный приоритет</option>
          </select>

          <input
            type="datetime-local"
            className="rounded-lg border p-3"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
            aria-label="Срок выполнения"
          />

          <button
            type="button"
            onClick={() => void handleCreateTask()}
            disabled={saving || !title.trim()}
            className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Сохраняем..." : "Добавить"}
          </button>
        </section>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-8">Загрузка задач...</p>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {columns.map((column) => (
              <section
                key={column.status}
                className="rounded-2xl bg-slate-200/70 p-4"
              >
                <h2 className="font-semibold">
                  {column.title} ({groupedTasks[column.status].length})
                </h2>

                <div className="mt-4 space-y-3">
                  {groupedTasks[column.status].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                    />
                  ))}

                  {groupedTasks[column.status].length === 0 && (
                    <p className="text-sm text-gray-500">Нет задач</p>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
TSX

cat > app/projects/'[id]'/tasks/components/TaskCard.tsx <<'TSX'
"use client";

import type { Task } from "@/types/task";

type TaskCardProps = {
  task: Task;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
};

const statusLabels: Record<Task["status"], string> = {
  todo: "Сделать",
  in_progress: "В работе",
  review: "Проверка",
  done: "Готово",
  cancelled: "Отменено",
};

const priorityLabels: Record<Task["priority"], string> = {
  low: "Низкий",
  normal: "Обычный",
  high: "Высокий",
  urgent: "Срочный",
};

export default function TaskCard({ task, onStatusChange }: TaskCardProps) {
  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-900">{task.title}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
          {priorityLabels[task.priority]}
        </span>
      </div>

      {task.description && (
        <p className="mt-2 text-sm text-gray-600">{task.description}</p>
      )}

      {task.due_at && (
        <p className="mt-3 text-xs text-slate-500">
          Срок: {new Date(task.due_at).toLocaleString("ru-RU")}
        </p>
      )}

      <label className="mt-4 block text-sm text-gray-600">
        Статус
        <select
          className="mt-1 w-full rounded border p-2"
          value={task.status}
          onChange={(event) =>
            onStatusChange(task.id, event.target.value as Task["status"])
          }
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}
TSX

cat > engineering/operations/OP-014-task-engine.md <<'MD'
# OP-014 — Task Engine

## Status

Prepared.

## Goal

Создать рабочий контур задач проекта с хранением в PostgreSQL, RLS, приоритетами, сроками и автоматической регистрацией событий в Project Activity Engine.

## Scope

- таблица `tasks`;
- RLS для участников проекта;
- статусы `todo`, `in_progress`, `review`, `done`, `cancelled`;
- приоритеты `low`, `normal`, `high`, `urgent`;
- сроки и назначение исполнителя;
- сервисный слой;
- Kanban UI (интерфейс доски задач);
- интеграция с `project_activities`.

## Definition of Done

- миграция применена;
- создание задачи работает;
- смена статуса работает;
- события появляются в `project_activities`;
- Lint, TypeScript и Build проходят;
- изменения зафиксированы в Git.
MD

python3 - <<'PY'
from pathlib import Path

sprint = Path("engineering/sprints/CURRENT_SPRINT.md")
text = sprint.read_text(encoding="utf-8")
text = text.replace("- OP-013 Project Timeline.", "- OP-013 Project Activity Engine — completed.")
text = text.replace("- OP-014 Documents foundation.", "- OP-014 Task Engine — in progress.\n- OP-015 Documents foundation.")
sprint.write_text(text, encoding="utf-8")

session = Path("engineering/daily/SESSION_LOG.md")
with session.open("a", encoding="utf-8") as handle:
    handle.write("\n## 2026-07-13 — OP-014 Task Engine\n\n- Подготовлены схема задач, RLS, сервис и рабочая Kanban-доска.\n- Добавлена интеграция задач с Project Activity Engine.\n")
PY

echo "created: database/migrations/20260713_007_create_tasks.sql"
echo "updated: types/task.ts"
echo "updated: services/tasks.ts"
echo "updated: app/projects/[id]/tasks/page.tsx"
echo "updated: app/projects/[id]/tasks/components/TaskCard.tsx"
echo "created: engineering/operations/OP-014-task-engine.md"
