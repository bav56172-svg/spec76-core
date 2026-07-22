"use client";

import { useEffect, useState } from "react";

import {
  createCompany,
  listCompanies,
} from "@/services/companies";
import type { Company } from "@/types/company";

export default function CompaniesPage() {
  const [name, setName] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void listCompanies().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        console.error(error);
        setCompanies([]);
      } else {
        setCompanies(data);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleCreateCompany() {
    const normalizedName = name.trim();

    if (!normalizedName) {
      alert("Введите название компании.");
      return;
    }

    const { data, error } = await createCompany({
      name: normalizedName,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setCompanies((current) => [data, ...current]);
    setName("");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-xl rounded-xl bg-white p-6 shadow">
        <h1 className="text-3xl font-bold">Компании</h1>

        <input
          className="mt-6 w-full rounded border p-3"
          placeholder="Название компании"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <button
          type="button"
          onClick={() => void handleCreateCompany()}
          className="mt-4 w-full rounded bg-blue-600 p-3 text-white"
        >
          Создать компанию
        </button>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">
            Список компаний
          </h2>

          {loading ? (
            <p className="text-gray-500">Загрузка...</p>
          ) : companies.length === 0 ? (
            <p className="text-gray-500">Компаний пока нет.</p>
          ) : (
            <div className="space-y-3">
              {companies.map((company) => (
                <article
                  key={company.id}
                  className="rounded-lg border bg-gray-50 p-4"
                >
                  <h3 className="font-semibold">{company.name}</h3>
                  <p className="text-sm text-gray-500">
                    Создано:{" "}
                    {new Date(company.created_at).toLocaleString()}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
