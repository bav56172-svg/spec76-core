"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createProject } from "@/services/projects";
import { getCurrentUserCompany } from "@/services/companies";

export default function NewProjectPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function handleCreateProject() {
    if (!title.trim()) {
      alert("Введите название проекта.");
      return;
    }

    const company = await getCurrentUserCompany();

    if (!company) {
      alert("Сначала необходимо создать компанию.");
      return;
    }

    const { error } = await createProject({
      company_id: company.id,
      owner_id: company.owner_id,
      title,
      description,
      status: "draft",
    });

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/projects");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow">
        <h1 className="text-3xl font-bold">
          📁 Новый проект
        </h1>

        <p className="mt-2 text-gray-600">
          Создайте новый проект или заказ.
        </p>

        <div className="mt-8">
          <label className="mb-2 block font-medium">
            Название проекта
          </label>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border p-3"
            placeholder="Например: Строительство дома"
          />
        </div>

        <div className="mt-6">
          <label className="mb-2 block font-medium">
            Описание
          </label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-40 w-full rounded-lg border p-3"
            placeholder="Опишите задачу..."
          />
        </div>

        <button
          onClick={handleCreateProject}
          className="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Создать проект
        </button>
      </div>
    </main>
  );
}