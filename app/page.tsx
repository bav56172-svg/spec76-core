"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/services/supabase";

export default function Home() {
  const [email, setEmail] = useState<string | null>(null);
  const [navigationNotice, setNavigationNotice] = useState<string | null>(
    null,
  );

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
        <h1 className="text-3xl font-bold">SPEC76 OS</h1>
        <p className="text-slate-300">AI Construction Platform</p>
      </header>

      <div className="mx-auto max-w-5xl p-8">
        <div className="mb-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-2xl font-semibold">Добро пожаловать!</h2>

          <p className="mt-2 text-gray-600">
            {email ?? "Пользователь не авторизован"}
          </p>

          <button
            type="button"
            onClick={signOut}
            className="mt-6 rounded bg-red-600 px-4 py-2 text-white"
          >
            Выйти
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

          <button
            type="button"
            onClick={() =>
              setNavigationNotice(
                "Раздел «AI-агенты» пока не входит в текущий релиз SPEC76.",
              )
            }
            className="rounded-xl bg-white p-6 text-left shadow transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            🤖 AI-агенты
          </button>

          <button
            type="button"
            onClick={() =>
              setNavigationNotice(
                "Раздел «Настройки» пока не входит в текущий релиз SPEC76.",
              )
            }
            className="rounded-xl bg-white p-6 text-left shadow transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            ⚙️ Настройки
          </button>
        </div>

        {navigationNotice ? (
          <p
            role="status"
            className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-slate-700 shadow-sm"
          >
            {navigationNotice}
          </p>
        ) : null}
      </div>
    </main>
  );
}
