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
