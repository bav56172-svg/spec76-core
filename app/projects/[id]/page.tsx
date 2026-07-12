"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getProject } from "@/services/projects";
import type { Project } from "@/types/project";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    void getProject(projectId).then(({ data, error: loadError }) => {
      if (!isActive) {
        return;
      }

      if (loadError) {
        setError(loadError.message);
        setProject(null);
      } else {
        setProject(data as Project);
        setError(null);
      }

      setLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [projectId]);

  if (loading) {
    return <main className="p-8">Загрузка заявки...</main>;
  }

  if (error || !project) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <div className="rounded-xl border bg-white p-6 shadow">
          <h1 className="text-2xl font-bold">Заявка не найдена</h1>
          <p className="mt-3 text-gray-600">
            {error ?? "Запрошенная заявка недоступна."}
          </p>
          <Link
            href="/projects"
            className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-white"
          >
            Вернуться к заявкам
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                Заявка SPEC76
              </p>
              <h1 className="mt-2 text-3xl font-bold">{project.title}</h1>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {project.status}
            </span>
          </div>

          <p className="mt-6 whitespace-pre-wrap text-gray-700">
            {project.description || "Описание пока не добавлено."}
          </p>

          <dl className="mt-6 grid gap-4 border-t pt-6 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Создана</dt>
              <dd className="mt-1 font-medium">
                {new Date(project.created_at).toLocaleString("ru-RU")}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Обновлена</dt>
              <dd className="mt-1 font-medium">
                {new Date(project.updated_at).toLocaleString("ru-RU")}
              </dd>
            </div>
          </dl>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={`/projects/${project.id}/tasks`}
            className="rounded-xl bg-white p-6 shadow transition hover:shadow-md"
          >
            <h2 className="text-xl font-semibold">Задачи по заявке</h2>
            <p className="mt-2 text-gray-600">
              Разбить работу на понятные этапы и контролировать выполнение.
            </p>
          </Link>

          <div className="rounded-xl border border-dashed bg-white p-6">
            <h2 className="text-xl font-semibold">Предложения исполнителей</h2>
            <p className="mt-2 text-gray-600">
              Этот модуль будет подключён следующим этапом MVP.
            </p>
          </div>
        </div>

        <Link href="/projects" className="inline-block text-blue-700 hover:underline">
          ← Все заявки
        </Link>
      </div>
    </main>
  );
}
