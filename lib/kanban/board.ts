export type Task = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
};

export type Column = {
  id: Task["status"];
  title: string;
};

export const columns: Column[] = [
  { id: "todo", title: "To Do (Сделать)" },
  { id: "in_progress", title: "In Progress (В работе)" },
  { id: "done", title: "Done (Готово)" },
];

/**
 * 📦 группировка задач
 */
export function groupTasks(tasks: Task[]) {
  return {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    done: tasks.filter((t) => t.status === "done"),
  };
}