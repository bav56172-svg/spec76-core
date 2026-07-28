"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "./lib/supabase";

export default function Home() {
  const [email, setEmail] = useState<string | null>(null);

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
      <header className="bg-slate-900 text-white p-6 shadow">
        <h1 className="text-3xl font-bold">SPEC76 OS</h1>
        <p className="text-slate-300">AI Construction Platform</p>
      </header>

      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold">Добро пожаловать!</h2>

          <p className="mt-2 text-gray-600">
            {email ?? "Пользователь не авторизован"}
          </p>

          <button
            onClick={signOut}
            className="mt-6 rounded bg-red-600 px-4 py-2 text-white"
          >
            Выйти
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Link
            href="/projects"
            className="rounded-xl bg-white p-6 shadow hover:bg-slate-50 transition block"
          >
            📁 Проекты
          </Link>

          <div className="rounded-xl bg-white p-6 shadow">🏢 Компании</div>

          <div className="rounded-xl bg-white p-6 shadow">🤖 AI-агенты</div>

          <div className="rounded-xl bg-white p-6 shadow">⚙️ Настройки</div>
        </div>
      </div>
    </main>
  );
}
