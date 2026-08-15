"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getCurrentUserCompany } from "@/services/companies";
import { listCompanyOffers } from "@/services/offers";
import type { Offer } from "@/types/offer";
import type { Request } from "@/types/request";

type CompanyOffer = Offer & { request: Request };

const STATUS_LABELS: Record<Offer["status"], string> = {
  submitted: "Отправлено",
  accepted: "Принято",
  rejected: "Отклонено",
  withdrawn: "Отозвано",
};

export default function MyOffersPage() {
  const [offers, setOffers] = useState<CompanyOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noCompany, setNoCompany] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchOffers() {
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

      const offersResult = await listCompanyOffers(companyResult.data.id);

      if (!active) return;

      if (offersResult.error) {
        setErrorMessage(offersResult.error.message);
        setLoading(false);
        return;
      }

      setOffers(offersResult.data);
      setLoading(false);
    }

    void fetchOffers();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Мои отклики</h1>

        {loading ? <p className="mt-8">Загрузка...</p> : null}

        {!loading && errorMessage ? (
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            {errorMessage}
          </div>
        ) : null}

        {!loading && noCompany ? (
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            Отклики видны только компаниям-исполнителям.
          </div>
        ) : null}

        {!loading && !noCompany && !errorMessage && offers.length === 0 ? (
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            Вы пока не откликались ни на одну заявку. Загляните в{" "}
            <Link href="/contractor/requests" className="text-blue-600 underline">
              доступные заказы
            </Link>
            .
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {offers.map((offer) => (
            <Link
              key={offer.id}
              href={`/requests/${offer.request_id}`}
              className="block rounded-xl bg-white p-6 shadow transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {offer.request.title}
                </h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                  {STATUS_LABELS[offer.status]}
                </span>
              </div>
              <div className="mt-4 flex gap-4 text-sm text-gray-500">
                <span>Цена: {offer.price.toLocaleString("ru-RU")} ₽</span>
                {offer.proposed_days ? (
                  <span>Срок: {offer.proposed_days} дн.</span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
