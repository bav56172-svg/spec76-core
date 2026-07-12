#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

mkdir -p database/migrations services types app/requests/'[id]'

cat > types/request.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export type RequestUrgency = "normal" | "urgent" | "scheduled";

export type RequestStatus =
  | "draft"
  | "analyzing"
  | "published"
  | "matching"
  | "offers_received"
  | "accepted"
  | "cancelled"
  | "expired";

export interface Request {
  id: EntityId;
  customer_id: EntityId;
  title: string;
  description: string;
  city: string;
  location_text: string | null;
  urgency: RequestUrgency;
  desired_start_at: IsoDateTime | null;
  status: RequestStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface RequestCreateInput {
  title: string;
  description: string;
  city: string;
  location_text?: string | null;
  urgency: RequestUrgency;
  desired_start_at?: IsoDateTime | null;
}
EOF

python3 - <<'PY'
from pathlib import Path
path = Path("types/index.ts")
text = path.read_text()
line = 'export * from "./request";\n'
if line not in text:
    marker = 'export * from "./review";\n'
    text = text.replace(marker, marker + line)
    path.write_text(text)
PY

cat > services/requests.ts <<'EOF'
import { supabase } from "@/services/supabase";
import type { Request, RequestCreateInput } from "@/types/request";

export async function createRequest(input: RequestCreateInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { data: null, error: userError };
  }

  if (!user) {
    return {
      data: null,
      error: new Error("Для создания заявки необходимо войти в систему."),
    };
  }

  return await supabase
    .from("requests")
    .insert({
      customer_id: user.id,
      title: input.title.trim(),
      description: input.description.trim(),
      city: input.city.trim(),
      location_text: input.location_text?.trim() || null,
      urgency: input.urgency,
      desired_start_at: input.desired_start_at || null,
      status: "draft",
    })
    .select("*")
    .single<Request>();
}

export async function getRequest(id: string) {
  return await supabase
    .from("requests")
    .select("*")
    .eq("id", id)
    .single<Request>();
}

export async function getMyRequests() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: userError ?? new Error("Пользователь не найден.") };
  }

  return await supabase
    .from("requests")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Request[]>();
}
EOF

cat > database/migrations/20260712_001_create_requests.sql <<'EOF'
create extension if not exists pgcrypto;

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 160),
  description text not null check (char_length(trim(description)) between 10 and 5000),
  city text not null check (char_length(trim(city)) between 2 and 120),
  location_text text,
  urgency text not null default 'normal'
    check (urgency in ('normal', 'urgent', 'scheduled')),
  desired_start_at timestamptz,
  status text not null default 'draft'
    check (status in (
      'draft',
      'analyzing',
      'published',
      'matching',
      'offers_received',
      'accepted',
      'cancelled',
      'expired'
    )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists requests_customer_id_idx
  on public.requests(customer_id);

create index if not exists requests_status_created_at_idx
  on public.requests(status, created_at desc);

create or replace function public.set_updated_at()
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

drop trigger if exists requests_set_updated_at on public.requests;
create trigger requests_set_updated_at
before update on public.requests
for each row execute function public.set_updated_at();

alter table public.requests enable row level security;

drop policy if exists "Customers can read own requests" on public.requests;
create policy "Customers can read own requests"
on public.requests
for select
to authenticated
using (customer_id = auth.uid());

drop policy if exists "Customers can create own requests" on public.requests;
create policy "Customers can create own requests"
on public.requests
for insert
to authenticated
with check (customer_id = auth.uid());

drop policy if exists "Customers can update own draft requests" on public.requests;
create policy "Customers can update own draft requests"
on public.requests
for update
to authenticated
using (customer_id = auth.uid() and status = 'draft')
with check (customer_id = auth.uid());
EOF

cat > app/projects/new/page.tsx <<'EOF'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createRequest } from "@/services/requests";
import type { RequestUrgency } from "@/types/request";

const initialCity = "Ярославль";

export default function NewRequestPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState(initialCity);
  const [locationText, setLocationText] = useState("");
  const [urgency, setUrgency] = useState<RequestUrgency>("normal");
  const [desiredStartAt, setDesiredStartAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (title.trim().length < 3) {
      setErrorMessage("Кратко назовите задачу — минимум 3 символа.");
      return;
    }

    if (description.trim().length < 10) {
      setErrorMessage("Опишите задачу подробнее — минимум 10 символов.");
      return;
    }

    if (city.trim().length < 2) {
      setErrorMessage("Укажите город выполнения работ.");
      return;
    }

    setSubmitting(true);

    const { data, error } = await createRequest({
      title,
      description,
      city,
      location_text: locationText,
      urgency,
      desired_start_at:
        urgency === "scheduled" && desiredStartAt
          ? new Date(desiredStartAt).toISOString()
          : null,
    });

    setSubmitting(false);

    if (error || !data) {
      setErrorMessage(error?.message ?? "Не удалось создать заявку.");
      return;
    }

    router.push(`/requests/${data.id}`);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-8"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Шаг 1 из 2
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Что необходимо сделать?
        </h1>
        <p className="mt-3 text-slate-600">
          Опишите проблему обычными словами. Знать модель техники или точное
          название услуги не требуется.
        </p>

        <div className="mt-8 space-y-6">
          <label className="block">
            <span className="font-medium text-slate-900">Краткое название</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-600"
              placeholder="Например: Убрать снег возле склада"
              maxLength={160}
              required
            />
          </label>

          <label className="block">
            <span className="font-medium text-slate-900">Описание задачи</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 min-h-44 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-600"
              placeholder="Укажите объём, особенности территории, желаемый результат и всё, что считаете важным."
              maxLength={5000}
              required
            />
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="font-medium text-slate-900">Город</span>
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-600"
                required
              />
            </label>

            <label className="block">
              <span className="font-medium text-slate-900">Адрес или ориентир</span>
              <input
                value={locationText}
                onChange={(event) => setLocationText(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-600"
                placeholder="Можно указать позже"
              />
            </label>
          </div>

          <fieldset>
            <legend className="font-medium text-slate-900">Срочность</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {([
                ["normal", "Обычная"],
                ["urgent", "Срочно"],
                ["scheduled", "К определённой дате"],
              ] as const).map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 p-3"
                >
                  <input
                    type="radio"
                    name="urgency"
                    value={value}
                    checked={urgency === value}
                    onChange={() => setUrgency(value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {urgency === "scheduled" && (
            <label className="block">
              <span className="font-medium text-slate-900">Желаемая дата начала</span>
              <input
                type="datetime-local"
                value={desiredStartAt}
                onChange={(event) => setDesiredStartAt(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-600"
                required
              />
            </label>
          )}
        </div>

        {errorMessage && (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Создаём заявку..." : "Создать черновик заявки"}
        </button>
      </form>
    </main>
  );
}
EOF

cat > 'app/requests/[id]/page.tsx' <<'EOF'
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
EOF

echo "created: types/request.ts"
echo "updated: types/index.ts"
echo "created: services/requests.ts"
echo "created: database/migrations/20260712_001_create_requests.sql"
echo "updated: app/projects/new/page.tsx"
echo "created: app/requests/[id]/page.tsx"
