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
