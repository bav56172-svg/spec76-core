#!/usr/bin/env bash
set -u

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR" || exit 1

mkdir -p 'app/projects/[id]/tasks/components'

cat > 'app/projects/[id]/tasks/components/TaskCard.tsx' <<'EOF'
"use client";

import type { Task } from "@/types/task";

type TaskCardProps = {
  task: Task;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
};

const statusLabels: Record<Task["status"], string> = {
  todo: "Сделать",
  in_progress: "В работе",
  review: "Проверка",
  done: "Готово",
  cancelled: "Отменено",
};

export default function TaskCard({ task, onStatusChange }: TaskCardProps) {
  return (
    <article className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="font-semibold">{task.title}</h3>

      {task.description && (
        <p className="mt-2 text-sm text-gray-600">{task.description}</p>
      )}

      <label className="mt-4 block text-sm text-gray-600">
        Статус
        <select
          className="mt-1 w-full rounded border p-2"
          value={task.status}
          onChange={(event) =>
            onStatusChange(task.id, event.target.value as Task["status"])
          }
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}
EOF

cat > 'app/projects/[id]/tasks/page.tsx' <<'EOF'
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/services/supabase";
import type { Task } from "@/types/task";
import TaskCard from "./components/TaskCard";

const columns: Array<{
  status: Task["status"];
  title: string;
}> = [
  { status: "todo", title: "Сделать" },
  { status: "in_progress", title: "В работе" },
  { status: "review", title: "Проверка" },
  { status: "done", title: "Готово" },
];

export default function TasksPage() {
  const params = useParams<{ id: string | string[] }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true })
      .then(({ data, error: loadError }) => {
        if (!active) return;

        if (loadError) {
          setError(loadError.message);
          setTasks([]);
        } else {
          setTasks((data ?? []) as Task[]);
        }

        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [projectId]);

  const groupedTasks = useMemo(() => {
    return columns.reduce<Record<Task["status"], Task[]>>(
      (accumulator, column) => {
        accumulator[column.status] = tasks.filter(
          (task) => task.status === column.status,
        );
        return accumulator;
      },
      {
        todo: [],
        in_progress: [],
        review: [],
        done: [],
        cancelled: [],
      },
    );
  }, [tasks]);

  async function createTask() {
    const normalizedTitle = title.trim();
    if (!normalizedTitle || saving) return;

    setSaving(true);
    setError(null);

    const position = tasks.length;
    const { data, error: createError } = await supabase
      .from("tasks")
      .insert({
        project_id: projectId,
        title: normalizedTitle,
        description: null,
        status: "todo",
        position,
      })
      .select("*")
      .single();

    if (createError) {
      setError(createError.message);
    } else if (data) {
      setTasks((current) => [...current, data as Task]);
      setTitle("");
    }

    setSaving(false);
  }

  async function updateTaskStatus(
    taskId: string,
    status: Task["status"],
  ) {
    const previousTasks = tasks;

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, status } : task,
      ),
    );

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", taskId);

    if (updateError) {
      setTasks(previousTasks);
      setError(updateError.message);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href={`/projects/${projectId}`}
              className="text-sm text-blue-700 hover:underline"
            >
              ← К заявке
            </Link>
            <h1 className="mt-2 text-3xl font-bold">Задачи заявки</h1>
          </div>
        </div>

        <div className="mt-6 flex gap-3 rounded-xl bg-white p-4 shadow">
          <input
            className="w-full rounded border p-3"
            placeholder="Новая задача"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void createTask();
              }
            }}
          />
          <button
            type="button"
            onClick={() => void createTask()}
            disabled={saving || !title.trim()}
            className="rounded bg-slate-900 px-5 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Сохраняем..." : "Добавить"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-8">Загрузка задач...</p>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {columns.map((column) => (
              <section
                key={column.status}
                className="rounded-xl bg-slate-200/70 p-4"
              >
                <h2 className="font-semibold">
                  {column.title} ({groupedTasks[column.status].length})
                </h2>

                <div className="mt-4 space-y-3">
                  {groupedTasks[column.status].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={updateTaskStatus}
                    />
                  ))}

                  {groupedTasks[column.status].length === 0 && (
                    <p className="text-sm text-gray-500">Нет задач</p>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
EOF

echo "stabilized: app/projects/[id]/tasks/page.tsx"
echo "stabilized: app/projects/[id]/tasks/components/TaskCard.tsx"
