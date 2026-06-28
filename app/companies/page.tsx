"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function CompaniesPage() {
  const [name, setName] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  async function createCompany() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Необходимо войти в систему.");
      return;
    }

    const { error } = await supabase.from("companies").insert({
      name,
      owner_id: user.id,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Компания успешно создана!");
      setName("");
    }
  }
  async function loadCompanies() {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });
  
    if (error) {
      console.error(error);
    } else {
      setCompanies(data);
    }
  }
  
  useEffect(() => {
    loadCompanies();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-xl rounded-xl bg-white p-6 shadow">

        <h1 className="text-3xl font-bold">
          🏢 Компании
        </h1>

        <input
          className="mt-6 w-full rounded border p-3"
          placeholder="Название компании"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={createCompany}
          className="mt-4 w-full rounded bg-blue-600 p-3 text-white"
        >
          Создать компанию
        </button>
        <div className="mt-8">
  <h2 className="mb-3 text-xl font-semibold">
    Список компаний
  </h2>

  {companies.length === 0 ? (
    <p className="text-gray-500">
      Компаний пока нет.
    </p>
  ) : (
    <div className="space-y-3">
      {companies.map((company) => (
        <div
          key={company.id}
          className="rounded-lg border bg-gray-50 p-4"
        >
          <h3 className="font-semibold">
            {company.name}
          </h3>

          <p className="text-sm text-gray-500">
            Создано:{" "}
            {new Date(company.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )}
</div>
      </div>
    </main>
  );
}