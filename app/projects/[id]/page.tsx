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
