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

const priorityLabels: Record<Task["priority"], string> = {
  low: "Низкий",
  normal: "Обычный",
  high: "Высокий",
  urgent: "Срочный",
};

export default function TaskCard({ task, onStatusChange }: TaskCardProps) {
  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-900">{task.title}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
          {priorityLabels[task.priority]}
        </span>
      </div>

      {task.description && (
        <p className="mt-2 text-sm text-gray-600">{task.description}</p>
      )}

      {task.due_at && (
        <p className="mt-3 text-xs text-slate-500">
          Срок: {new Date(task.due_at).toLocaleString("ru-RU")}
        </p>
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
