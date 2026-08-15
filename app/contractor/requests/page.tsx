"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getCurrentUserCompany } from "@/services/companies";
import { listAvailableRequestsForCompany } from "@/services/contractorMatching";
import type { ContractorMatch } from "@/types/contractor-match";
import type { Request } from "@/types/request";

type AvailableRequest = ContractorMatch & { request: Request };

export default function AvailableRequestsPage() {
  const [matches, setMatches] = useState<AvailableRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noCompany, setNoCompany] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchAvailableRequests() {
      const companyResult = await getCurrentUserCompany();

      if (!active) return;

      if (companyResult.error) {
        if (companyResult.error.code !== "AUTH_REQUIRED") {
          setErrorMessage(companyResult.error.message);
        }
        setLoading(false);
        return;
      }

      if (!companyResult.data) {
        setNoCompany(true);
        setLoading(false);
        return;
      }

      const matchesResult = await listAvailableRequestsForCompany(
        companyResult.data.id,
      );

      if (!active) return;

      if (matchesResult.error) {
        setErrorMessage(matchesResult.error.message);
        setLoading(false);
        return;
      }

      setMatches(matchesResult.data);
      setLoading(false);
    }

    void fetchAvailableRequests();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Доступные заказы</h1>

        {loading ? <p className="mt-8">Загрузка...</p> : null}

        {!loading && errorMessage ? (
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            {errorMessage}
          </div>
        ) : null}

        {!loading && noCompany ? (
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            Доступные заказы видны только компаниям-исполнителям. Создайте
            профиль компании, чтобы получать подходящие заявки.
          </div>
        ) : null}

        {!loading && !errorMessage && !noCompany && matches.length === 0 ? (
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            Подходящих заказов пока нет. Новые заявки появляются здесь
            автоматически после подбора по вашим услугам и технике.
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {matches.map((match) => (
            <Link
              key={match.id}
              href={`/requests/${match.request.id}`}
              className="block rounded-xl bg-white p-6 shadow transition hover:shadow-md"
            >
              <h2 className="text-xl font-semibold">{match.request.title}</h2>
              <p className="mt-2 text-gray-600">{match.request.description}</p>
              <div className="mt-4 flex gap-4 text-sm text-gray-500">
                <span>Город: {match.request.city}</span>
                <span>Статус: {match.request.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
