#!/usr/bin/env bash
set -euo pipefail

mkdir -p types services database/migrations 'app/requests/[id]'

cat > types/offer.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export type OfferStatus = "submitted" | "accepted" | "rejected" | "withdrawn";

export interface OfferCompany {
  id: EntityId;
  name: string;
  city: string | null;
}

export interface Offer {
  id: EntityId;
  request_id: EntityId;
  company_id: EntityId;
  price: number;
  currency: "RUB";
  proposed_days: number | null;
  message: string | null;
  status: OfferStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  company?: OfferCompany | null;
}

export interface OfferCreateInput {
  request_id: EntityId;
  company_id: EntityId;
  price: number;
  proposed_days?: number | null;
  message?: string | null;
}
EOF

echo "updated: types/offer.ts"

cat > services/offers.ts <<'EOF'
import { supabase } from "@/services/supabase";
import type { Offer, OfferCreateInput } from "@/types/offer";

export async function getOffersForRequest(requestId: string) {
  return await supabase
    .from("offers")
    .select("*, company:companies(id, name, city)")
    .eq("request_id", requestId)
    .order("price", { ascending: true })
    .returns<Offer[]>();
}

export async function submitOffer(input: OfferCreateInput) {
  return await supabase
    .from("offers")
    .upsert(
      {
        request_id: input.request_id,
        company_id: input.company_id,
        price: input.price,
        currency: "RUB",
        proposed_days: input.proposed_days ?? null,
        message: input.message?.trim() || null,
        status: "submitted",
      },
      { onConflict: "request_id,company_id" },
    )
    .select("*, company:companies(id, name, city)")
    .single<Offer>();
}

export async function acceptOffer(offerId: string) {
  const { error } = await supabase.rpc("accept_offer", {
    p_offer_id: offerId,
  });

  if (error) {
    return { data: null, error };
  }

  return { data: true, error: null };
}
EOF

echo "created: services/offers.ts"

cat > database/migrations/20260713_004_create_offers.sql <<'EOF'
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  price numeric(14,2) not null check (price > 0),
  currency text not null default 'RUB' check (currency = 'RUB'),
  proposed_days integer check (proposed_days is null or proposed_days between 1 and 365),
  message text check (message is null or char_length(trim(message)) <= 2000),
  status text not null default 'submitted'
    check (status in ('submitted', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, company_id)
);

create index if not exists offers_request_status_price_idx
  on public.offers(request_id, status, price);

create unique index if not exists offers_one_accepted_per_request_idx
  on public.offers(request_id)
  where status = 'accepted';

drop trigger if exists offers_set_updated_at on public.offers;
create trigger offers_set_updated_at
before update on public.offers
for each row execute function public.set_updated_at();

alter table public.offers enable row level security;

drop policy if exists "Customers read offers for own requests" on public.offers;
create policy "Customers read offers for own requests"
on public.offers for select to authenticated
using (
  exists (
    select 1 from public.requests
    where requests.id = offers.request_id
      and requests.customer_id = auth.uid()
  )
);

drop policy if exists "Company owners read own offers" on public.offers;
create policy "Company owners read own offers"
on public.offers for select to authenticated
using (
  exists (
    select 1 from public.companies
    where companies.id = offers.company_id
      and companies.owner_id = auth.uid()
  )
);

drop policy if exists "Matched company owners submit offers" on public.offers;
create policy "Matched company owners submit offers"
on public.offers for insert to authenticated
with check (
  exists (
    select 1 from public.companies
    where companies.id = offers.company_id
      and companies.owner_id = auth.uid()
  )
  and exists (
    select 1 from public.request_matches
    where request_matches.request_id = offers.request_id
      and request_matches.company_id = offers.company_id
      and request_matches.is_current = true
  )
);

drop policy if exists "Company owners update submitted offers" on public.offers;
create policy "Company owners update submitted offers"
on public.offers for update to authenticated
using (
  status = 'submitted'
  and exists (
    select 1 from public.companies
    where companies.id = offers.company_id
      and companies.owner_id = auth.uid()
  )
)
with check (
  status in ('submitted', 'withdrawn')
  and exists (
    select 1 from public.companies
    where companies.id = offers.company_id
      and companies.owner_id = auth.uid()
  )
);

create or replace function public.accept_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_request_id uuid;
  target_status text;
begin
  select request_id
    into target_request_id
  from public.offers
  where id = p_offer_id;

  if target_request_id is null then
    raise exception 'Offer not found';
  end if;

  if not exists (
    select 1
    from public.requests
    where id = target_request_id
      and customer_id = auth.uid()
  ) then
    raise exception 'Access denied';
  end if;

  select status
    into target_status
  from public.requests
  where id = target_request_id
  for update;

  if target_status = 'accepted' then
    if exists (
      select 1 from public.offers
      where id = p_offer_id and status = 'accepted'
    ) then
      return;
    end if;

    raise exception 'Another offer is already accepted';
  end if;

  update public.offers
  set status = case when id = p_offer_id then 'accepted' else 'rejected' end
  where request_id = target_request_id
    and status in ('submitted', 'accepted');

  update public.requests
  set status = 'accepted'
  where id = target_request_id;
end;
$$;

grant execute on function public.accept_offer(uuid) to authenticated;
EOF

echo "created: database/migrations/20260713_004_create_offers.sql"

cat > 'app/requests/[id]/page.tsx' <<'EOF'
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
import { getCurrentUserCompany } from "@/services/companies";
import { acceptOffer, getOffersForRequest, submitOffer } from "@/services/offers";
import { getRequest } from "@/services/requests";
import type { Company } from "@/types/company";
import type { ContractorMatch } from "@/types/contractor-match";
import type { Offer } from "@/types/offer";
import type { Request } from "@/types/request";
import type { RequestAnalysis } from "@/types/request-analysis";

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [analysis, setAnalysis] = useState<RequestAnalysis | null>(null);
  const [matches, setMatches] = useState<ContractorMatch[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [price, setPrice] = useState("");
  const [proposedDays, setProposedDays] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [matching, setMatching] = useState(false);
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function reloadOffers() {
    const result = await getOffersForRequest(params.id);
    if (!result.error && result.data) setOffers(result.data);
  }

  useEffect(() => {
    let active = true;

    void Promise.all([
      getRequest(params.id),
      getCurrentRequestAnalysis(params.id),
      getCurrentContractorMatches(params.id),
      getOffersForRequest(params.id),
      getCurrentUserCompany(),
    ]).then(([requestResult, analysisResult, matchesResult, offersResult, company]) => {
      if (!active) return;

      if (requestResult.error || !requestResult.data) {
        setErrorMessage(requestResult.error?.message ?? "Заявка не найдена.");
      } else {
        setRequest(requestResult.data);
      }

      if (!analysisResult.error && analysisResult.data) setAnalysis(analysisResult.data);
      if (!matchesResult.error && matchesResult.data) setMatches(matchesResult.data);
      if (!offersResult.error && offersResult.data) setOffers(offersResult.data);
      if (company) setCurrentCompany(company as Company);
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

  async function handleSubmitOffer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentCompany) return;

    const numericPrice = Number(price.replace(",", "."));
    const numericDays = proposedDays ? Number(proposedDays) : null;

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setErrorMessage("Укажите корректную стоимость предложения.");
      return;
    }

    setSubmittingOffer(true);
    setErrorMessage(null);
    const { data, error } = await submitOffer({
      request_id: params.id,
      company_id: currentCompany.id,
      price: numericPrice,
      proposed_days: numericDays,
      message: offerMessage,
    });
    setSubmittingOffer(false);

    if (error || !data) {
      setErrorMessage(error?.message ?? "Не удалось отправить предложение.");
      return;
    }

    setPrice("");
    setProposedDays("");
    setOfferMessage("");
    await reloadOffers();
  }

  async function handleAcceptOffer(offerId: string) {
    setAcceptingOfferId(offerId);
    setErrorMessage(null);
    const { error } = await acceptOffer(offerId);
    setAcceptingOfferId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const requestResult = await getRequest(params.id);
    if (!requestResult.error && requestResult.data) setRequest(requestResult.data);
    await reloadOffers();
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

  const currentCompanyMatched = Boolean(
    currentCompany && matches.some((match) => match.company_id === currentCompany.id),
  );
  const requestAccepted = request.status === "accepted";

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
            <div><h2 className="font-semibold text-blue-950">Анализ заявки</h2><p className="mt-1 text-sm text-blue-900">Система определит услуги, технику, материалы и вопросы для уточнения.</p></div>
            <button type="button" onClick={handleAnalyze} disabled={analyzing} className="rounded-lg bg-blue-700 px-4 py-2 font-medium text-white disabled:opacity-60">
              {analyzing ? "Анализируем..." : analysis ? "Повторить анализ" : "Анализировать заявку"}
            </button>
          </div>
          {analysis && <div className="mt-5 space-y-4 text-sm text-slate-800">
            <div><strong>Услуги:</strong> {analysis.services.join(", ")}</div>
            <div><strong>Техника:</strong> {analysis.equipment.length ? analysis.equipment.join(", ") : "Не определена"}</div>
            <div><strong>Материалы:</strong> {analysis.materials.length ? analysis.materials.join(", ") : "Не требуются или не определены"}</div>
            <div><strong>Объём:</strong> {analysis.estimated_scope ?? "Требуется уточнение"}</div>
            <div><strong>Уверенность:</strong> {Math.round(analysis.confidence * 100)}%</div>
          </div>}
        </section>

        <section className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-semibold text-emerald-950">Подбор исполнителей</h2><p className="mt-1 text-sm text-emerald-900">Система сравнит город, услуги и необходимую технику с профилями компаний.</p></div>
            <button type="button" onClick={handleMatching} disabled={matching || !analysis} className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
              {matching ? "Подбираем..." : matches.length ? "Повторить подбор" : "Подобрать исполнителей"}
            </button>
          </div>
          {matches.length > 0 && <div className="mt-5 space-y-3">{matches.map((match) => (
            <article key={match.id} className="rounded-xl border border-emerald-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold text-slate-900">{match.company?.name ?? "Компания"}</h3><p className="mt-1 text-sm text-slate-600">{match.company?.city ?? "Город не указан"}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">{Math.round(match.score)}%</span></div>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">{match.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
            </article>
          ))}</div>}
        </section>

        <section className="mt-8 rounded-xl border border-violet-200 bg-violet-50 p-5">
          <h2 className="font-semibold text-violet-950">Предложения исполнителей</h2>
          <p className="mt-1 text-sm text-violet-900">Исполнитель указывает стоимость, срок и комментарий. Заказчик выбирает одно предложение.</p>

          {currentCompany && currentCompanyMatched && !requestAccepted && (
            <form onSubmit={handleSubmitOffer} className="mt-5 grid gap-3 rounded-xl border border-violet-200 bg-white p-4 sm:grid-cols-2">
              <label className="block"><span className="text-sm font-medium text-slate-800">Стоимость, ₽</span><input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" className="mt-1 w-full rounded-lg border p-3" required /></label>
              <label className="block"><span className="text-sm font-medium text-slate-800">Срок, дней</span><input value={proposedDays} onChange={(event) => setProposedDays(event.target.value)} type="number" min="1" max="365" className="mt-1 w-full rounded-lg border p-3" /></label>
              <label className="block sm:col-span-2"><span className="text-sm font-medium text-slate-800">Комментарий</span><textarea value={offerMessage} onChange={(event) => setOfferMessage(event.target.value)} maxLength={2000} className="mt-1 min-h-24 w-full rounded-lg border p-3" placeholder="Что входит в стоимость и когда готовы приступить" /></label>
              <button type="submit" disabled={submittingOffer} className="rounded-lg bg-violet-700 px-4 py-3 font-semibold text-white disabled:opacity-60 sm:col-span-2">{submittingOffer ? "Отправляем..." : "Отправить предложение"}</button>
            </form>
          )}

          {offers.length === 0 ? (
            <p className="mt-5 text-sm text-violet-900">Предложений пока нет.</p>
          ) : (
            <div className="mt-5 space-y-3">{offers.map((offer) => (
              <article key={offer.id} className="rounded-xl border border-violet-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{offer.company?.name ?? "Компания"}</h3><p className="text-sm text-slate-600">{offer.company?.city ?? "Город не указан"}</p></div><div className="text-right"><p className="text-xl font-bold text-slate-900">{offer.price.toLocaleString("ru-RU")} ₽</p><p className="text-sm text-slate-600">{offer.proposed_days ? `${offer.proposed_days} дн.` : "Срок не указан"}</p></div></div>
                {offer.message && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{offer.message}</p>}
                <div className="mt-4 flex items-center justify-between gap-3"><span className="rounded-full bg-violet-100 px-3 py-1 text-sm text-violet-800">{offer.status}</span>{offer.status === "submitted" && !requestAccepted && <button type="button" onClick={() => void handleAcceptOffer(offer.id)} disabled={acceptingOfferId === offer.id} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{acceptingOfferId === offer.id ? "Принимаем..." : "Выбрать исполнителя"}</button>}</div>
              </article>
            ))}</div>
          )}
        </section>
      </article>
    </main>
  );
}
EOF

echo "updated: app/requests/[id]/page.tsx"
