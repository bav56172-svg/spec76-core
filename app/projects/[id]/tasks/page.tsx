"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  createTask,
  getTasks,
  updateTaskStatus,
} from "@/services/tasks";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";
import TaskCard from "./components/TaskCard";

const columns: Array<{ status: TaskStatus; title: string }> = [
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
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [dueAt, setDueAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getTasks(projectId).then(({ data, error: loadError }) => {
      if (!active) return;

      if (loadError) {
        setError(loadError.message);
        setTasks([]);
      } else {
        setTasks(data ?? []);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [projectId]);

  const groupedTasks = useMemo(() => {
    return columns.reduce<Record<TaskStatus, Task[]>>(
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

  async function handleCreateTask() {
    const normalizedTitle = title.trim();
    if (!normalizedTitle || saving) return;

    setSaving(true);
    setError(null);

    const { data, error: createError } = await createTask({
      project_id: projectId,
      title: normalizedTitle,
      priority,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      position: tasks.length,
    });

    if (createError) {
      setError(createError.message);
    } else if (data) {
      setTasks((current) => [...current, data]);
      setTitle("");
      setPriority("normal");
      setDueAt("");
    }

    setSaving(false);
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    const previousTasks = tasks;

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, status } : task,
      ),
    );

    const { data, error: updateError } = await updateTaskStatus(taskId, status);

    if (updateError) {
      setTasks(previousTasks);
      setError(updateError.message);
    } else if (data) {
      setTasks((current) =>
        current.map((task) => (task.id === taskId ? data : task)),
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-blue-700 hover:underline"
        >
          ← К рабочему пространству
        </Link>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Task Engine (движок задач)
            </p>
            <h1 className="mt-1 text-3xl font-bold">Задачи проекта</h1>
          </div>
          <p className="text-sm text-slate-600">Всего задач: {tasks.length}</p>
        </div>

        <section className="mt-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_220px_auto]">
          <input
            className="rounded-lg border p-3"
            placeholder="Новая задача"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleCreateTask();
            }}
          />

          <select
            className="rounded-lg border p-3"
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
          >
            <option value="low">Низкий приоритет</option>
            <option value="normal">Обычный приоритет</option>
            <option value="high">Высокий приоритет</option>
            <option value="urgent">Срочный приоритет</option>
          </select>

          <input
            type="datetime-local"
            className="rounded-lg border p-3"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
            aria-label="Срок выполнения"
          />

          <button
            type="button"
            onClick={() => void handleCreateTask()}
            disabled={saving || !title.trim()}
            className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Сохраняем..." : "Добавить"}
          </button>
        </section>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
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
                className="rounded-2xl bg-slate-200/70 p-4"
              >
                <h2 className="font-semibold">
                  {column.title} ({groupedTasks[column.status].length})
                </h2>

                <div className="mt-4 space-y-3">
                  {groupedTasks[column.status].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
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
