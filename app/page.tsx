"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUserCompany } from "@/services/companies";
import { supabase } from "@/services/supabase";

type ActionCardProps = {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  accent?: boolean;
};

const SESSION_TIMEOUT_MS = 3000;

async function getSessionWithTimeout() {
  return Promise.race([
    supabase.auth.getSession(),
    new Promise<never>((_, reject) => {
      window.setTimeout(
        () => reject(new Error("Истекло время ожидания сессии.")),
        SESSION_TIMEOUT_MS,
      );
    }),
  ]);
}

function ActionCard({
  href,
  eyebrow,
  title,
  description,
  icon,
  accent = false,
}: ActionCardProps) {
  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
        accent
          ? "border-amber-400 bg-amber-400 text-slate-950"
          : "border-slate-200 bg-white text-slate-900"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          aria-hidden="true"
          className={`flex size-11 items-center justify-center rounded-xl text-xl ${
            accent ? "bg-slate-950/10" : "bg-slate-100"
          }`}
        >
          {icon}
        </span>
        <span
          aria-hidden="true"
          className={`text-xl transition-transform duration-200 group-hover:translate-x-1 ${
            accent ? "text-slate-950/60" : "text-slate-400"
          }`}
        >
          →
        </span>
      </div>
      <p
        className={`mt-5 text-xs font-semibold uppercase tracking-[0.16em] ${
          accent ? "text-slate-950/60" : "text-slate-500"
        }`}
      >
        {eyebrow}
      </p>
      <h3 className="mt-1 text-lg font-semibold">{title}</h3>
      <p
        className={`mt-2 text-sm leading-6 ${
          accent ? "text-slate-950/70" : "text-slate-600"
        }`}
      >
        {description}
      </p>
    </Link>
  );
}

export default function Home() {
  const [email, setEmail] = useState<string | null>(null);
  const [hasCompany, setHasCompany] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      setIsLoading(false);

      let session = null;
      let error: Error | null = null;

      try {
        const result = await getSessionWithTimeout();
        session = result.data.session;
        error = result.error;
      } catch (sessionError) {
        error =
          sessionError instanceof Error
            ? sessionError
            : new Error("Не удалось загрузить сессию.");
      }

      if (!mounted) return;

      if (error) {
        console.error("Не удалось загрузить сессию:", error);
      }

      setEmail(session?.user.email ?? null);

      if (session?.user) {
        try {
          const companyResult = await getCurrentUserCompany();
          if (!mounted) return;
          setHasCompany(Boolean(companyResult.data));
        } catch (companyError) {
          console.error("Не удалось загрузить компанию:", companyError);
        }
      }
    }

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setEmail(session?.user.email ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Не удалось выйти из аккаунта:", error);
      return;
    }
    window.location.reload();
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <p role="status">Загрузка рабочего пространства…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f7f9] text-slate-950">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" translate="no">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-400 text-lg font-black text-slate-950">
              76
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">
                СпецТехника
              </span>
              <span className="block text-xs text-slate-400">
                Работа с техникой без лишних звонков
              </span>
            </span>
          </Link>

          {email ? (
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              Выйти
            </button>
          ) : (
            <Link
              href="/auth"
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Войти
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        {!email ? (
          <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
                Ярославская область
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 text-balance sm:text-6xl">
                Техника и исполнитель под вашу задачу
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Оставьте заявку на аренду техники или работу с оператором.
                Получите подходящие предложения и сопровождайте выполнение в
                одном рабочем пространстве.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/auth"
                  className="rounded-xl bg-slate-950 px-5 py-3.5 font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                >
                  Начать работу
                </Link>
                <Link
                  href="/auth"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-semibold text-slate-800 transition hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                >
                  Я исполнитель
                </Link>
              </div>
            </div>
            <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-8">
              <p className="text-sm text-slate-400">Как это работает</p>
              <ol className="mt-6 space-y-6">
                {[
                  ["01", "Опишите задачу", "Что нужно сделать, где и когда."],
                  ["02", "Получите предложения", "Мы покажем подходящую технику."],
                  ["03", "Запустите проект", "Согласуйте условия и контролируйте результат."],
                ].map(([number, title, description]) => (
                  <li key={number} className="flex gap-4">
                    <span className="font-mono text-sm text-amber-400">
                      {number}
                    </span>
                    <div>
                      <h2 className="font-semibold">{title}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : (
          <section>
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
                  Рабочее пространство
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 text-balance sm:text-4xl">
                  Добро пожаловать
                </h1>
                <p className="mt-2 text-slate-600">{email}</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-500" />
                Система работает
              </span>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hasCompany ? (
                <>
                  <ActionCard
                    href="/contractor/requests"
                    eyebrow="Для исполнителя"
                    title="Доступные заказы"
                    description="Задачи, которые подходят вашей технике и региону."
                    icon="📋"
                    accent
                  />
                  <ActionCard
                    href="/contractor/equipment"
                    eyebrow="Ваше предложение"
                    title="Моя техника"
                    description="Поддерживайте список техники и услуг актуальным."
                    icon="🚜"
                  />
                  <ActionCard
                    href="/contractor/offers"
                    eyebrow="В работе"
                    title="Мои отклики"
                    description="Следите за предложениями и их статусами."
                    icon="📨"
                  />
                </>
              ) : (
                <>
                  <ActionCard
                    href="/requests/new"
                    eyebrow="Главное действие"
                    title="Разместить заказ"
                    description="Опишите задачу — мы подберём технику и исполнителя."
                    icon="＋"
                    accent
                  />
                  <ActionCard
                    href="/requests"
                    eyebrow="Для заказчика"
                    title="Мои заказы"
                    description="Смотрите предложения, статусы и историю работ."
                    icon="📄"
                  />
                  <ActionCard
                    href="/projects"
                    eyebrow="Выполнение"
                    title="Мои проекты"
                    description="Общайтесь с исполнителем и контролируйте результат."
                    icon="↗"
                  />
                </>
              )}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Link
                href="/companies"
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              >
                <p className="text-sm font-semibold text-slate-900">
                  Компании и контакты
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Управляйте профилем компании и доступом команды.
                </p>
              </Link>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">
                  Следующий шаг
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Начните с одного действия — остальное появится по мере
                  продвижения заявки.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
