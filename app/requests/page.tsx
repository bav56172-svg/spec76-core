"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getMyRequests } from "@/services/requests";
import type { Request } from "@/types/request";

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchRequests() {
      const result = await getMyRequests();

      if (!active) return;

      if (result.error) {
        if (result.error.code !== "AUTH_REQUIRED") {
          setErrorMessage(result.error.message);
        }
        setLoading(false);
        return;
      }

      setRequests(result.data);
      setLoading(false);
    }

    void fetchRequests();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Мои заявки</h1>

          <Link
            href="/requests/new"
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            Новая заявка
          </Link>
        </div>

        {loading ? <p className="mt-8">Загрузка...</p> : null}

        {!loading && errorMessage ? (
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            {errorMessage}
          </div>
        ) : null}

        {!loading && !errorMessage && requests.length === 0 ? (
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            Заявок пока нет.
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {requests.map((request) => (
            <Link
              key={request.id}
              href={`/requests/${request.id}`}
              className="block rounded-xl bg-white p-6 shadow transition hover:shadow-md"
            >
              <h2 className="text-xl font-semibold">{request.title}</h2>
              <p className="mt-2 text-gray-600">{request.description}</p>
              <div className="mt-4 text-sm text-gray-500">
                Статус: {request.status}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
