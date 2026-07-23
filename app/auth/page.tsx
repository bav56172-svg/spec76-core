"use client";

import { useState } from "react";

import { requestEmailSignIn } from "@/services/auth";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn() {
    if (submitting) return;

    setSubmitting(true);

    const { error } = await requestEmailSignIn(email);

    setSubmitting(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Проверьте почту.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-[350px] space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-3xl font-bold">Вход в SPEC76</h1>

        <input
          type="email"
          placeholder="Введите email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-gray-400 bg-white p-3 text-black"
        />

        <button
          type="button"
          onClick={() => void handleSignIn()}
          disabled={submitting}
          className="w-full rounded bg-white p-3 text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Отправляем ссылку..." : "Войти"}
        </button>
      </div>
    </main>
  );
}
