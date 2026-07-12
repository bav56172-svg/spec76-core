#!/usr/bin/env bash

set -u

cat > app/companies/page.tsx <<'EOF'
"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/services/supabase";
import type { Company } from "@/types/company";

export default function CompaniesPage() {
  const [name, setName] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          console.error(error);
          setCompanies([]);
        } else {
          setCompanies((data ?? []) as Company[]);
        }

        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function createCompany() {
    const normalizedName = name.trim();

    if (!normalizedName) {
      alert("Введите название компании.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Необходимо войти в систему.");
      return;
    }

    const { data, error } = await supabase
      .from("companies")
      .insert({
        name: normalizedName,
        owner_id: user.id,
      })
      .select("*")
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setCompanies((current) => [data as Company, ...current]);
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
          onClick={() => void createCompany()}
          className="mt-4 w-full rounded bg-blue-600 p-3 text-white"
        >
          Создать компанию
        </button>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">Список компаний</h2>

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
                    Создано: {new Date(company.created_at).toLocaleString()}
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
EOF

cat > app/projects/page.tsx <<'EOF'
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getProjects } from "@/services/projects";
import { supabase } from "@/services/supabase";
import type { Project } from "@/types/project";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchProjects() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!active) return;

      if (!company) {
        setLoading(false);
        return;
      }

      const { data } = await getProjects(company.id);

      if (!active) return;

      setProjects((data ?? []) as Project[]);
      setLoading(false);
    }

    void fetchProjects();

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
            href="/projects/new"
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            Новая заявка
          </Link>
        </div>

        {loading ? <p className="mt-8">Загрузка...</p> : null}

        {!loading && projects.length === 0 ? (
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            Заявок пока нет.
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block rounded-xl bg-white p-6 shadow transition hover:shadow-md"
            >
              <h2 className="text-xl font-semibold">{project.title}</h2>
              <p className="mt-2 text-gray-600">
                {project.description ?? "Описание не указано"}
              </p>
              <div className="mt-4 text-sm text-gray-500">
                Статус: {project.status}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
EOF

echo "stabilized: app/companies/page.tsx"
echo "stabilized: app/projects/page.tsx"
