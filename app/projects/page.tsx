"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getCurrentUserCompany } from "@/services/companies";
import { getProjects } from "@/services/projects";
import type { Project } from "@/types/project";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchProjects() {
      const companyResult = await getCurrentUserCompany();

      if (!active) return;

      if (companyResult.error) {
        if (companyResult.error.code !== "AUTH_REQUIRED") {
          setErrorMessage(companyResult.error.message);
        }

        setLoading(false);
        return;
      }

      if (!companyResult.data) {
        setLoading(false);
        return;
      }

      const projectsResult = await getProjects(companyResult.data.id);

      if (!active) return;

      if (projectsResult.error) {
        setErrorMessage(projectsResult.error.message);
        setLoading(false);
        return;
      }

      setProjects(projectsResult.data);
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
          <h1 className="text-3xl font-bold">Проекты компании</h1>
        </div>

        {loading ? <p className="mt-8">Загрузка...</p> : null}

        {!loading && errorMessage ? (
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            {errorMessage}
          </div>
        ) : null}

        {!loading && !errorMessage && projects.length === 0 ? (
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            Проектов пока нет.
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block rounded-xl bg-white p-6 shadow transition hover:shadow-md"
            >
              <h2 className="text-xl font-semibold">
                {project.title}
              </h2>
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
