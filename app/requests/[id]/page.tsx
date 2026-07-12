"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getRequest } from "@/services/requests";
import type { Request } from "@/types/request";

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getRequest(params.id).then(({ data, error }) => {
      if (!active) return;

      if (error || !data) {
        setErrorMessage(error?.message ?? "Заявка не найдена.");
      } else {
        setRequest(data);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [params.id]);

  if (loading) {
    return <main className="p-8">Загрузка заявки...</main>;
  }

  if (errorMessage || !request) {
    return (
      <main className="p-8">
        <p className="text-red-700">{errorMessage ?? "Заявка не найдена."}</p>
        <Link href="/projects/new" className="mt-4 inline-block text-blue-700">
          Создать новую заявку
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-8">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Заявка создана
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              {request.title}
            </h1>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
            {request.status}
          </span>
        </div>

        <p className="mt-6 whitespace-pre-wrap text-slate-700">
          {request.description}
        </p>

        <dl className="mt-8 grid gap-4 rounded-xl bg-slate-50 p-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Город</dt>
            <dd className="font-medium text-slate-900">{request.city}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Срочность</dt>
            <dd className="font-medium text-slate-900">{request.urgency}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Место</dt>
            <dd className="font-medium text-slate-900">
              {request.location_text || "Будет уточнено позже"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Создано</dt>
            <dd className="font-medium text-slate-900">
              {new Date(request.created_at).toLocaleString("ru-RU")}
            </dd>
          </div>
        </dl>

        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-semibold text-blue-950">Следующий шаг</h2>
          <p className="mt-2 text-sm text-blue-900">
            В Module 002 (модуле 002) система проанализирует описание, определит
            услуги, технику и материалы, после чего предложит публикацию заявки.
          </p>
        </div>
      </article>
    </main>
  );
}
