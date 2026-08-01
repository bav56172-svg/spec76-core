#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p engineering/operations

cat > types/project.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";
import type { TaskStatus } from "./task";

export type ProjectStatus =
  | "draft"
  | "published"
  | "active"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "archived";

export interface ProjectRequestSummary {
  id: EntityId;
  title: string;
  description: string;
  city: string;
  status: string;
}

export interface ProjectOfferSummary {
  id: EntityId;
  price: number;
  currency: "RUB";
  proposed_days: number | null;
  message: string | null;
  status: string;
}

export interface ProjectCompanySummary {
  id: EntityId;
  name: string;
  city: string | null;
  phone: string | null;
  email: string | null;
}

export interface ProjectTaskSummary {
  id: EntityId;
  title: string;
  status: TaskStatus;
  position: number;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface ProjectTaskMetrics {
  total: number;
  todo: number;
  in_progress: number;
  review: number;
  done: number;
  cancelled: number;
  completion_percent: number;
}

export interface ProjectActivityItem {
  id: string;
  title: string;
  description: string;
  created_at: IsoDateTime;
}

export interface Project {
  id: EntityId;
  request_id: EntityId | null;
  accepted_offer_id: EntityId | null;
  company_id: EntityId;
  owner_id: EntityId;
  title: string;
  description: string | null;
  status: ProjectStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface ProjectWorkspace extends Project {
  request?: ProjectRequestSummary | null;
  accepted_offer?: ProjectOfferSummary | null;
  company?: ProjectCompanySummary | null;
}

export interface ProjectExecutionWorkspace extends ProjectWorkspace {
  tasks: ProjectTaskSummary[];
  task_metrics: ProjectTaskMetrics;
  activity: ProjectActivityItem[];
}

export type ProjectCreateInput = Pick<Project, "title"> &
  Partial<Pick<Project, "description" | "company_id">>;
EOF

cat > services/projects.ts <<'EOF'
import { supabase } from "@/services/supabase";
import type {
  Project,
  ProjectActivityItem,
  ProjectExecutionWorkspace,
  ProjectTaskMetrics,
  ProjectTaskSummary,
  ProjectWorkspace,
} from "@/types/project";

const PROJECT_WORKSPACE_SELECT = `
  *,
  request:requests(id, title, description, city, status),
  accepted_offer:offers(id, price, currency, proposed_days, message, status),
  company:companies(id, name, city, phone, email)
`;

function buildTaskMetrics(tasks: ProjectTaskSummary[]): ProjectTaskMetrics {
  const count = (status: ProjectTaskSummary["status"]) =>
    tasks.filter((task) => task.status === status).length;
  const activeTotal = tasks.filter((task) => task.status !== "cancelled").length;
  const done = count("done");

  return {
    total: tasks.length,
    todo: count("todo"),
    in_progress: count("in_progress"),
    review: count("review"),
    done,
    cancelled: count("cancelled"),
    completion_percent: activeTotal === 0 ? 0 : Math.round((done / activeTotal) * 100),
  };
}

function buildActivity(
  project: ProjectWorkspace,
  tasks: ProjectTaskSummary[],
): ProjectActivityItem[] {
  const items: ProjectActivityItem[] = [
    {
      id: `project-created-${project.id}`,
      title: "Проект создан",
      description: "Принятое предложение преобразовано в проект выполнения.",
      created_at: project.created_at,
    },
  ];

  if (project.accepted_offer) {
    items.push({
      id: `offer-accepted-${project.accepted_offer.id}`,
      title: "Исполнитель выбран",
      description: `Принято предложение на ${project.accepted_offer.price.toLocaleString("ru-RU")} ₽.`,
      created_at: project.created_at,
    });
  }

  for (const task of tasks) {
    items.push({
      id: `task-${task.id}-${task.status}`,
      title: task.status === "done" ? "Задача завершена" : "Задача обновлена",
      description: task.title,
      created_at: task.updated_at,
    });
  }

  return items.sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

export async function getProject(id: string) {
  return await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single<Project>();
}

export async function getProjectWorkspace(id: string) {
  return await supabase
    .from("projects")
    .select(PROJECT_WORKSPACE_SELECT)
    .eq("id", id)
    .single<ProjectWorkspace>();
}

export async function getProjectExecutionWorkspace(id: string) {
  const [projectResult, tasksResult] = await Promise.all([
    getProjectWorkspace(id),
    supabase
      .from("tasks")
      .select("id, title, status, position, created_at, updated_at")
      .eq("project_id", id)
      .order("position", { ascending: true })
      .returns<ProjectTaskSummary[]>(),
  ]);

  if (projectResult.error || !projectResult.data) {
    return { data: null, error: projectResult.error };
  }

  if (tasksResult.error) {
    return { data: null, error: tasksResult.error };
  }

  const tasks = tasksResult.data ?? [];
  const data: ProjectExecutionWorkspace = {
    ...projectResult.data,
    tasks,
    task_metrics: buildTaskMetrics(tasks),
    activity: buildActivity(projectResult.data, tasks),
  };

  return { data, error: null };
}

export async function createProject(
  project: Omit<Project, "id" | "created_at" | "updated_at">,
) {
  return await supabase
    .from("projects")
    .insert(project)
    .select()
    .single<Project>();
}

export async function getProjects(companyId: string) {
  return await supabase
    .from("projects")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .returns<Project[]>();
}

export async function updateProject(id: string, updates: Partial<Project>) {
  return await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single<Project>();
}

export async function deleteProject(id: string) {
  return await supabase.from("projects").delete().eq("id", id);
}
EOF

cat > 'app/projects/[id]/page.tsx' <<'EOF'
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getProjectExecutionWorkspace } from "@/services/projects";
import type { ProjectExecutionWorkspace, ProjectStatus } from "@/types/project";

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
  const [project, setProject] = useState<ProjectExecutionWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getProjectExecutionWorkspace(params.id).then(({ data, error: loadError }) => {
      if (!active) return;

      if (loadError || !data) {
        setError(loadError?.message ?? "Проект не найден.");
        setProject(null);
      } else {
        setProject(data);
        setError(null);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [params.id]);

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

  const metrics = project.task_metrics;
  const nextTasks = project.tasks.filter((task) => task.status !== "done" && task.status !== "cancelled").slice(0, 4);

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

          <div className="mt-7">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Прогресс выполнения</span>
              <span>{metrics.completion_percent}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${metrics.completion_percent}%` }} />
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Всего задач", metrics.total],
            ["В работе", metrics.in_progress],
            ["На проверке", metrics.review],
            ["Завершено", metrics.done],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <article className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Ближайшие задачи</h2>
                  <p className="mt-1 text-sm text-slate-600">Приоритетный рабочий список проекта.</p>
                </div>
                <Link href={`/projects/${project.id}/tasks`} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                  Открыть доску задач
                </Link>
              </div>

              {nextTasks.length === 0 ? (
                <p className="mt-5 rounded-xl border border-dashed p-5 text-sm text-slate-600">
                  Активных задач пока нет. Создайте первую задачу на доске проекта.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {nextTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-4 rounded-xl border p-4">
                      <div>
                        <p className="font-medium text-slate-900">{task.title}</p>
                        <p className="mt-1 text-sm text-slate-500">Обновлено: {formatDate(task.updated_at)}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{task.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Быстрые действия</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <Link href={`/projects/${project.id}/tasks`} className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm font-semibold text-sky-950">Добавить задачу</Link>
                <Link href={`/projects/${project.id}/docs`} className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">Открыть документы</Link>
                <Link href={`/projects/${project.id}/governance`} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-950">Контроль проекта</Link>
              </div>
            </article>

            <article className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Условия выполнения</h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                <div><dt className="text-sm text-slate-500">Исполнитель</dt><dd className="mt-1 font-medium">{project.company?.name ?? "Не определён"}</dd></div>
                <div><dt className="text-sm text-slate-500">Стоимость</dt><dd className="mt-1 font-medium">{project.accepted_offer ? `${project.accepted_offer.price.toLocaleString("ru-RU")} ₽` : "Не определена"}</dd></div>
                <div><dt className="text-sm text-slate-500">Срок</dt><dd className="mt-1 font-medium">{project.accepted_offer?.proposed_days ? `${project.accepted_offer.proposed_days} дн.` : "Не указан"}</dd></div>
              </dl>
            </article>
          </div>

          <aside className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Activity Feed (лента действий)</h2>
            <div className="mt-5 space-y-5">
              {project.activity.slice(0, 8).map((item) => (
                <div key={item.id} className="border-l-2 border-sky-200 pl-4">
                  <h3 className="font-medium text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  <p className="mt-2 text-xs text-slate-400">{formatDate(item.created_at)}</p>
                </div>
              ))}
            </div>
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

cat > engineering/operations/OP-012-project-execution-workspace.md <<'EOF'
# OP-012 — Project Execution Workspace

Статус: In Progress

## Goal

Превратить карточку проекта в рабочий центр управления выполнением заказа.

## Definition of Ready

- Project Activation завершён.
- Связи Request → Offer → Project существуют.
- Таблица tasks и канбан-доска доступны.
- Репозиторий и база данных синхронизированы.

## Scope

- агрегированная сводка проекта;
- вычисляемый прогресс по задачам;
- метрики задач;
- список ближайших задач;
- лента действий;
- быстрые переходы к задачам, документам и контролю.

## Architectural Decision

Execution Workspace не создаёт отдельное хранилище. Он агрегирует Project, Request, Offer, Company и Tasks через сервисный слой.

## Definition of Done

- Lint, TypeScript и Production Build успешны;
- страница проекта отображает прогресс и метрики;
- пустые состояния не блокируют работу;
- инженерные артефакты обновлены;
- изменения зафиксированы и отправлены в GitHub.
EOF

python3 - <<'PY'
from pathlib import Path

sprint = Path("engineering/sprints/CURRENT_SPRINT.md")
text = sprint.read_text(encoding="utf-8")
text = text.replace("- OP-000 Engineering OS Foundation — in progress.", "- OP-000 Engineering OS Foundation — completed.")
text = text.replace("- OP-012 Task Board and execution workflow.", "- OP-012 Project Execution Workspace — in progress.")
sprint.write_text(text, encoding="utf-8")

session = Path("engineering/daily/SESSION_LOG.md")
marker = "## 2026-07-13 — OP-012 started"
if marker not in session.read_text(encoding="utf-8"):
    with session.open("a", encoding="utf-8") as file:
        file.write("\n\n" + marker + "\n\n- Engineering OS проверена.\n- Definition of Ready выполнен.\n- Начата реализация рабочего пространства выполнения проекта.\n")
PY

printf '%s\n' \
  "created: engineering/operations/OP-012-project-execution-workspace.md" \
  "updated: types/project.ts" \
  "updated: services/projects.ts" \
  "updated: app/projects/[id]/page.tsx" \
  "updated: engineering/sprints/CURRENT_SPRINT.md" \
  "updated: engineering/daily/SESSION_LOG.md"
