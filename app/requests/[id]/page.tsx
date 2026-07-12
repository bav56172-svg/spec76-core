"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  getCurrentRequestAnalysis,
  runRequestAnalysis,
} from "@/services/requestAnalysis";
import {
  getCurrentContractorMatches,
  runContractorMatching,
} from "@/services/contractorMatching";
import { getRequest } from "@/services/requests";
import type { ContractorMatch } from "@/types/contractor-match";
import type { Request } from "@/types/request";
import type { RequestAnalysis } from "@/types/request-analysis";

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [analysis, setAnalysis] = useState<RequestAnalysis | null>(null);
  const [matches, setMatches] = useState<ContractorMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [matching, setMatching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([
      getRequest(params.id),
      getCurrentRequestAnalysis(params.id),
      getCurrentContractorMatches(params.id),
    ]).then(([requestResult, analysisResult, matchesResult]) => {
      if (!active) return;

      if (requestResult.error || !requestResult.data) {
        setErrorMessage(requestResult.error?.message ?? "Заявка не найдена.");
      } else {
        setRequest(requestResult.data);
      }

      if (!analysisResult.error && analysisResult.data) {
        setAnalysis(analysisResult.data);
      }

      if (!matchesResult.error && matchesResult.data) {
        setMatches(matchesResult.data);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [params.id]);

  async function handleAnalyze() {
    if (!request) return;

    setAnalyzing(true);
    setErrorMessage(null);
    const { data, error } = await runRequestAnalysis(request);
    setAnalyzing(false);

    if (error || !data) {
      setErrorMessage(error?.message ?? "Не удалось выполнить анализ заявки.");
      return;
    }

    setAnalysis(data);
  }

  async function handleMatching() {
    if (!request || !analysis) return;

    setMatching(true);
    setErrorMessage(null);
    const { data, error } = await runContractorMatching(request, analysis);
    setMatching(false);

    if (error || !data) {
      setErrorMessage(error?.message ?? "Не удалось подобрать исполнителей.");
      return;
    }

    setMatches(data);
  }

  if (loading) return <main className="p-8">Загрузка заявки...</main>;

  if (errorMessage && !request) {
    return (
      <main className="p-8">
        <p className="text-red-700">{errorMessage}</p>
        <Link href="/projects/new" className="mt-4 inline-block text-blue-700">
          Создать новую заявку
        </Link>
      </main>
    );
  }

  if (!request) return null;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-8">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Заявка создана</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{request.title}</h1>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{request.status}</span>
        </div>

        <p className="mt-6 whitespace-pre-wrap text-slate-700">{request.description}</p>

        <dl className="mt-8 grid gap-4 rounded-xl bg-slate-50 p-5 sm:grid-cols-2">
          <div><dt className="text-sm text-slate-500">Город</dt><dd className="font-medium text-slate-900">{request.city}</dd></div>
          <div><dt className="text-sm text-slate-500">Срочность</dt><dd className="font-medium text-slate-900">{request.urgency}</dd></div>
          <div><dt className="text-sm text-slate-500">Место</dt><dd className="font-medium text-slate-900">{request.location_text || "Будет уточнено позже"}</dd></div>
          <div><dt className="text-sm text-slate-500">Создано</dt><dd className="font-medium text-slate-900">{new Date(request.created_at).toLocaleString("ru-RU")}</dd></div>
        </dl>

        {errorMessage && <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{errorMessage}</p>}

        <section className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-blue-950">Анализ заявки</h2>
              <p className="mt-1 text-sm text-blue-900">Система определит услуги, технику, материалы и вопросы для уточнения.</p>
            </div>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="rounded-lg bg-blue-700 px-4 py-2 font-medium text-white disabled:opacity-60"
            >
              {analyzing ? "Анализируем..." : analysis ? "Повторить анализ" : "Анализировать заявку"}
            </button>
          </div>

          {analysis && (
            <div className="mt-5 space-y-4 text-sm text-slate-800">
              <div><strong>Услуги:</strong> {analysis.services.join(", ")}</div>
              <div><strong>Техника:</strong> {analysis.equipment.length ? analysis.equipment.join(", ") : "Не определена"}</div>
              <div><strong>Материалы:</strong> {analysis.materials.length ? analysis.materials.join(", ") : "Не требуются или не определены"}</div>
              <div><strong>Объём:</strong> {analysis.estimated_scope ?? "Требуется уточнение"}</div>
              <div><strong>Уверенность:</strong> {Math.round(analysis.confidence * 100)}%</div>
              {analysis.clarifications.length > 0 && (
                <div>
                  <strong>Нужно уточнить:</strong>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {analysis.clarifications.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-emerald-950">Подбор исполнителей</h2>
              <p className="mt-1 text-sm text-emerald-900">
                Система сравнит город, услуги и необходимую технику с профилями компаний.
              </p>
            </div>
            <button
              type="button"
              onClick={handleMatching}
              disabled={matching || !analysis}
              className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {matching ? "Подбираем..." : matches.length ? "Повторить подбор" : "Подобрать исполнителей"}
            </button>
          </div>

          {!analysis && (
            <p className="mt-4 text-sm text-emerald-900">Сначала выполните анализ заявки.</p>
          )}

          {analysis && matches.length === 0 && (
            <p className="mt-4 text-sm text-emerald-900">
              Подходящие компании пока не найдены. Для подбора компаниям нужно заполнить город, услуги и технику.
            </p>
          )}

          {matches.length > 0 && (
            <div className="mt-5 space-y-3">
              {matches.map((match) => (
                <article key={match.id} className="rounded-xl border border-emerald-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{match.company?.name ?? "Компания"}</h3>
                      <p className="mt-1 text-sm text-slate-600">{match.company?.city ?? "Город не указан"}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                      {Math.round(match.score)}%
                    </span>
                  </div>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {match.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>
      </article>
    </main>
  );
}
