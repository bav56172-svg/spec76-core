"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");

  async function signUp() {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Проверьте почту.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-[350px] space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-3xl font-bold">
          SPEC76 Login
        </h1>

        <input
  type="email"
  placeholder="Введите email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full border border-gray-400 rounded-md p-3 text-black bg-white"
/>

        <button
          onClick={signUp}
          className="w-full rounded bg-white p-3 text-black"
        >
          Войти
        </button>
      </div>
    </main>
  );
}