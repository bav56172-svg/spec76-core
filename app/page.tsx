"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUserCompany } from "@/services/companies";
import { supabase } from "@/services/supabase";

export default function Home() {
  const [email, setEmail] = useState<string | null>(null);
  const [hasCompany, setHasCompany] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        console.error("Не удалось загрузить сессию:", error);
      }

      setEmail(session?.user.email ?? null);

      if (!session?.user) {
        return;
      }

      // Relies on RLS the user already has read access to (EP-024,
      // already on main) — no new permissions needed for this decision.
      const companyResult = await getCurrentUserCompany();

      if (!mounted) return;

      setHasCompany(Boolean(companyResult.data));
    }

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      setEmail(session?.user.email ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 p-6 text-white shadow">
        <h1 className="text-3xl font-bold">SPEC76</h1>
        <p className="text-slate-300">
          Заявки на услуги спецтехники — от запроса до сдачи работ
        </p>
      </header>

      <div className="mx-auto max-w-5xl p-8">
        <div className="mb-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-2xl font-semibold">Добро пожаловать!</h2>

          <p className="mt-2 text-gray-600">
            {email ?? "Пользователь не авторизован"}
          </p>

          {email ? (
            <button
              type="button"
              onClick={signOut}
              className="mt-6 rounded bg-red-600 px-4 py-2 text-white"
            >
              Выйти
            </button>
          ) : (
            <Link
              href="/auth"
              className="mt-6 inline-block rounded bg-blue-600 px-4 py-2 text-white"
            >
              Войти
            </Link>
          )}
        </div>

        {email ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {hasCompany ? (
              <>
                <Link
                  href="/contractor/requests"
                  className="block rounded-xl bg-white p-6 shadow transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  📋 Доступные заказы
                </Link>
                <Link
                  href="/contractor/offers"
                  className="block rounded-xl bg-white p-6 shadow transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  📨 Мои отклики
                </Link>
                <Link
                  href="/contractor/equipment"
                  className="block rounded-xl bg-white p-6 shadow transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  🚜 Моя техника
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/requests/new"
                  className="block rounded-xl bg-white p-6 shadow transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  ➕ Разместить заказ
                </Link>
                <Link
                  href="/requests"
                  className="block rounded-xl bg-white p-6 shadow transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  📄 Мои заказы
                </Link>
              </>
            )}

            <Link
              href="/projects"
              className="block rounded-xl bg-white p-6 shadow transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              📁 Проекты
            </Link>

            <Link
              href="/companies"
              className="block rounded-xl bg-white p-6 shadow transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              🏢 Компании
            </Link>

            {/*
              TODO(OP-024): add a "Центр управления" link here once
              /admin and getMyPlatformRole() land on main — held back
              from this change so main never links to a page that
              doesn't exist yet on main.
            */}
          </div>
        ) : null}
      </div>
    </main>
  );
}
