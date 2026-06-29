"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/services/supabase";
import { getProjects } from "@/services/projects";
import { Project } from "@/types/project";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Пока берем первую компанию пользователя
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .single();

    if (!company) {
      setLoading(false);
      return;
    }

    const { data } = await getProjects(company.id);

    setProjects(data ?? []);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">

        <div className="flex items-center justify-between">

  <h1 className="text-3xl font-bold">
    📁 Мои проекты
  </h1>

  <a
    href="/projects/new"
    className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
  >
    + Новый проект
  </a>

</div>

        {loading && (
          <p className="mt-8">Загрузка...</p>
        )}

        {!loading && projects.length === 0 && (
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            Пока проектов нет.
          </div>
        )}

        <div className="mt-6 space-y-4">

          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl bg-white p-6 shadow"
            >
              <h2 className="text-xl font-semibold">
                {project.title}
              </h2>

              <p className="mt-2 text-gray-600">
                {project.description}
              </p>

              <div className="mt-4 text-sm text-gray-500">
                Статус: {project.status}
              </div>
            </div>
          ))}

        </div>

      </div>
    </main>
  );
}