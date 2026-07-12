#!/usr/bin/env bash
set -u

mkdir -p database/migrations types services 'app/requests/[id]'

cat > types/request-analysis.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export type RequestAnalysisStatus = "completed" | "needs_clarification";

export interface RequestAnalysis {
  id: EntityId;
  request_id: EntityId;
  services: string[];
  equipment: string[];
  materials: string[];
  estimated_scope: string | null;
  confidence: number;
  clarifications: string[];
  status: RequestAnalysisStatus;
  is_current: boolean;
  created_at: IsoDateTime;
}

export interface RequestAnalysisDraft {
  services: string[];
  equipment: string[];
  materials: string[];
  estimated_scope: string | null;
  confidence: number;
  clarifications: string[];
  status: RequestAnalysisStatus;
}
EOF

python3 - <<'PY'
from pathlib import Path
p = Path('types/index.ts')
text = p.read_text()
line = 'export * from "./request-analysis";\n'
if line not in text:
    text += line
p.write_text(text)
PY

cat > services/requestAnalysis.ts <<'EOF'
import { supabase } from "@/services/supabase";
import type { Request } from "@/types/request";
import type {
  RequestAnalysis,
  RequestAnalysisDraft,
} from "@/types/request-analysis";

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export function analyzeRequestLocally(request: Request): RequestAnalysisDraft {
  const text = `${request.title} ${request.description}`.toLowerCase();
  const services: string[] = [];
  const equipment: string[] = [];
  const materials: string[] = [];
  const clarifications: string[] = [];

  if (includesAny(text, ["снег", "снеж", "очистить территорию"])) {
    services.push("Уборка снега");
    equipment.push("Фронтальный погрузчик");
    if (includesAny(text, ["вывезти", "вывоз"])) {
      services.push("Вывоз снега");
      equipment.push("Самосвал");
    } else {
      clarifications.push("Нужно ли вывозить снег с территории?");
    }
  }

  if (includesAny(text, ["мусор", "отход", "демонтаж"])) {
    services.push("Вывоз строительного мусора");
    equipment.push("Самосвал");
    equipment.push("Погрузчик");
  }

  if (includesAny(text, ["котлован", "копать", "транше", "грунт"])) {
    services.push("Земляные работы");
    equipment.push("Экскаватор");
  }

  if (includesAny(text, ["песок", "щебень", "отсев"])) {
    services.push("Доставка сыпучих материалов");
    equipment.push("Самосвал");
    if (text.includes("песок")) materials.push("Песок");
    if (text.includes("щебень")) materials.push("Щебень");
    if (text.includes("отсев")) materials.push("Отсев");
  }

  const areaMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:м2|м²|кв(?:адратных)?\s*метр)/i);
  const volumeMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:м3|м³|куб(?:ов|ических\s*метр)?)/i);
  const estimatedScope = areaMatch
    ? `${areaMatch[1].replace(",", ".")} м²`
    : volumeMatch
      ? `${volumeMatch[1].replace(",", ".")} м³`
      : null;

  if (!estimatedScope) {
    clarifications.push("Какой ориентировочный объём или площадь работ?");
  }
  if (!request.location_text) {
    clarifications.push("Уточните адрес или ориентир места выполнения работ.");
  }
  if (services.length === 0) {
    services.push("Требуется ручная классификация");
    clarifications.push("Какой результат должен быть получен после выполнения работ?");
  }

  const confidence = Math.min(
    0.98,
    0.45 + services.length * 0.12 + equipment.length * 0.07 + (estimatedScope ? 0.12 : 0),
  );

  return {
    services: unique(services),
    equipment: unique(equipment),
    materials: unique(materials),
    estimated_scope: estimatedScope,
    confidence: Number(confidence.toFixed(2)),
    clarifications: unique(clarifications),
    status: clarifications.length > 0 ? "needs_clarification" : "completed",
  };
}

export async function getCurrentRequestAnalysis(requestId: string) {
  return await supabase
    .from("request_analyses")
    .select("*")
    .eq("request_id", requestId)
    .eq("is_current", true)
    .maybeSingle<RequestAnalysis>();
}

export async function runRequestAnalysis(request: Request) {
  const analysis = analyzeRequestLocally(request);

  const { error: resetError } = await supabase
    .from("request_analyses")
    .update({ is_current: false })
    .eq("request_id", request.id)
    .eq("is_current", true);

  if (resetError) {
    return { data: null, error: resetError };
  }

  return await supabase
    .from("request_analyses")
    .insert({
      request_id: request.id,
      ...analysis,
      is_current: true,
    })
    .select("*")
    .single<RequestAnalysis>();
}
EOF

cat > database/migrations/20260712_002_create_request_analyses.sql <<'EOF'
create table if not exists public.request_analyses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  services jsonb not null default '[]'::jsonb,
  equipment jsonb not null default '[]'::jsonb,
  materials jsonb not null default '[]'::jsonb,
  estimated_scope text,
  confidence numeric(4,3) not null check (confidence >= 0 and confidence <= 1),
  clarifications jsonb not null default '[]'::jsonb,
  status text not null check (status in ('completed', 'needs_clarification')),
  is_current boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists request_analyses_request_id_idx
  on public.request_analyses(request_id, created_at desc);

create unique index if not exists request_analyses_one_current_idx
  on public.request_analyses(request_id)
  where is_current = true;

alter table public.request_analyses enable row level security;

drop policy if exists "Customers can read analyses of own requests" on public.request_analyses;
create policy "Customers can read analyses of own requests"
on public.request_analyses
for select
to authenticated
using (
  exists (
    select 1 from public.requests r
    where r.id = request_id and r.customer_id = auth.uid()
  )
);

drop policy if exists "Customers can create analyses of own requests" on public.request_analyses;
create policy "Customers can create analyses of own requests"
on public.request_analyses
for insert
to authenticated
with check (
  exists (
    select 1 from public.requests r
    where r.id = request_id and r.customer_id = auth.uid()
  )
);

drop policy if exists "Customers can update analyses of own requests" on public.request_analyses;
create policy "Customers can update analyses of own requests"
on public.request_analyses
for update
to authenticated
using (
  exists (
    select 1 from public.requests r
    where r.id = request_id and r.customer_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.requests r
    where r.id = request_id and r.customer_id = auth.uid()
  )
);
EOF

cat > 'app/requests/[id]/page.tsx' <<'EOF'
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  getCurrentRequestAnalysis,
  runRequestAnalysis,
} from "@/services/requestAnalysis";
import { getRequest } from "@/services/requests";
import type { Request } from "@/types/request";
import type { RequestAnalysis } from "@/types/request-analysis";

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [analysis, setAnalysis] = useState<RequestAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([
      getRequest(params.id),
      getCurrentRequestAnalysis(params.id),
    ]).then(([requestResult, analysisResult]) => {
      if (!active) return;

      if (requestResult.error || !requestResult.data) {
        setErrorMessage(requestResult.error?.message ?? "Заявка не найдена.");
      } else {
        setRequest(requestResult.data);
      }

      if (!analysisResult.error && analysisResult.data) {
        setAnalysis(analysisResult.data);
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
      </article>
    </main>
  );
}
EOF

echo "created: types/request-analysis.ts"
echo "updated: types/index.ts"
echo "created: services/requestAnalysis.ts"
echo "created: database/migrations/20260712_002_create_request_analyses.sql"
echo "updated: app/requests/[id]/page.tsx"
