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
