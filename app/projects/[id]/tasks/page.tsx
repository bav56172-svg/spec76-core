"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/services/supabase";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";

/**
 * 🧠 TYPES
 */
type Task = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
};

type AIAction = {
  type: string;
  payload: any;
};

/**
 * 📦 COLUMNS
 */
const columns = [
  { id: "todo", title: "To Do (Сделать)" },
  { id: "in_progress", title: "In Progress (В работе)" },
  { id: "done", title: "Done (Готово)" },
];

/**
 * 🧠 AI HELPERS
 */
async function improveTask(title: string) {
  const res = await fetch("/api/ai/improve-task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });

  const data = await res.json();
  return data.result;
}

async function breakDownTask(title: string) {
  const res = await fetch("/api/ai/break-task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });

  const data = await res.json();
  return data.tasks as string[];
}

/**
 * 🟢 PAGE
 */
export default function TasksPage() {
  const { id } = useParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  /**
   * 🧠 AUTOPILOT STATE
   */
  const [autopilot, setAutopilot] = useState<any>(null);
  const [autoLoading, setAutoLoading] = useState(false);

  /**
   * ⚡ ACTION EXECUTION STATE
   */
  const [actions, setActions] = useState<AIAction[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);

  /**
   * 📦 LOAD TASKS
   */
  useEffect(() => {
    loadTasks();
  }, [id]);

  async function loadTasks() {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", id);

    setTasks((data as Task[]) || []);
  }

  /**
   * ➕ CREATE TASK
   */
  async function createTask(taskTitle: string) {
    if (!taskTitle.trim()) return;

    const { data } = await supabase
      .from("tasks")
      .insert({
        project_id: id,
        title: taskTitle,
        status: "todo",
      })
      .select()
      .single();

    if (data) {
      setTasks((prev) => [data as Task, ...prev]);
    }
  }

  /**
   * 🔁 UPDATE STATUS
   */
  async function updateStatus(
    taskId: string,
    status: Task["status"]
  ) {
    await supabase
      .from("tasks")
      .update({ status })
      .eq("id", taskId);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status } : t
      )
    );
  }

  /**
   * 🧠 AI GENERATION
   */
  async function handleAIGenerate() {
    if (!aiPrompt.trim()) return;

    setAiLoading(true);

    const res = await fetch("/api/ai/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: aiPrompt,
        projectId: id,
      }),
    });

    const data = await res.json();

    if (Array.isArray(data.tasks)) {
      for (const t of data.tasks) {
        await createTask(t);
      }
    }

    setAiPrompt("");
    setAiLoading(false);
  }

  /**
   * 🚀 AUTOPILOT
   */
  async function runAutopilot() {
    setAutoLoading(true);

    const res = await fetch("/api/ai/autopilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: id }),
    });

    const data = await res.json();

    setAutopilot(data);
    setAutoLoading(false);
  }

  /**
   * ⚡ ACTIONS LOADER
   */
  async function loadActions() {
    setActionsLoading(true);

    const res = await fetch("/api/ai/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: id }),
    });

    const data = await res.json();

    setActions(data.actions || []);
    setActionsLoading(false);
  }

  /**
   * ⚡ EXECUTE ACTION
   */
  async function executeAction(action: AIAction) {
    switch (action.type) {
      case "create_task":
        await createTask(action.payload.title);
        break;

      case "rename_task":
        setTasks((prev) =>
          prev.map((t) =>
            t.id === action.payload.id
              ? { ...t, title: action.payload.title }
              : t
          )
        );
        break;

      case "break_task":
        const subtasks = await breakDownTask(
          action.payload.title
        );

        for (const t of subtasks) {
          await createTask(t);
        }
        break;
    }

    setActions((prev) =>
      prev.filter((a) => a !== action)
    );
  }

  /**
   * 🧠 DRAG & DROP
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    updateStatus(
      active.id as string,
      over.id as Task["status"]
    );
  }

  /**
   * 🧠 AI TASK ACTIONS
   */
  async function handleImprove(task: Task) {
    const improved = await improveTask(task.title);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, title: improved }
          : t
      )
    );
  }

  async function handleBreakDown(task: Task) {
    const subtasks = await breakDownTask(task.title);

    for (const t of subtasks) {
      await createTask(t);
    }
  }

  /**
   * 📦 GROUPING
   */
  const grouped = {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter(
      (t) => t.status === "in_progress"
    ),
    done: tasks.filter((t) => t.status === "done"),
  };

  return (
    <div className="space-y-6 p-6">

      {/* 🧠 AUTOPILOT PANEL */}
      <div className="rounded-lg border bg-gradient-to-r from-black to-gray-900 p-4 text-white shadow">

        <div className="flex items-center justify-between">
          <h2 className="font-bold">
            🧠 AI Autopilot (Автопилот)
          </h2>

          <button
            onClick={runAutopilot}
            className="rounded bg-white px-3 py-1 text-sm text-black"
          >
            {autoLoading ? "..." : "Analyze"}
          </button>
        </div>

        {autopilot && (
          <div className="mt-4 space-y-2 text-sm">
            <div>
              <div className="text-green-300 font-semibold">
                Insights (Инсайты)
              </div>
              <ul className="list-disc pl-5">
                {autopilot.insights?.map((i: string, idx: number) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-red-300 font-semibold">
                Problems (Проблемы)
              </div>
              <ul className="list-disc pl-5">
                {autopilot.problems?.map((p: string, idx: number) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-blue-300 font-semibold">
                Actions (Действия)
              </div>
              <ul className="list-disc pl-5">
                {autopilot.actions?.map((a: string, idx: number) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

      </div>

      {/* ⚡ ACTION EXECUTION PANEL */}
      <div className="rounded-lg border bg-white p-4 shadow">

        <div className="flex items-center justify-between">
          <h2 className="font-bold">
            ⚡ AI Actions (Выполнение действий)
          </h2>

          <button
            onClick={loadActions}
            className="rounded bg-black px-3 py-1 text-sm text-white"
          >
            {actionsLoading ? "..." : "Load"}
          </button>
        </div>

        <div className="mt-4 space-y-2">

          {actions.length === 0 && (
            <p className="text-sm text-gray-500">
              No actions (нет действий)
            </p>
          )}

          {actions.map((action, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded border p-2"
            >
              <div className="text-sm">
                <span className="font-bold">
                  {action.type}
                </span>
                <span className="ml-2 text-gray-500">
                  {JSON.stringify(action.payload)}
                </span>
              </div>

              <button
                onClick={() => executeAction(action)}
                className="rounded bg-green-600 px-2 py-1 text-xs text-white"
              >
                Execute (Выполнить)
              </button>
            </div>
          ))}

        </div>

      </div>

      {/* 🧠 AI GENERATOR */}
      <div className="rounded-lg border bg-white p-4 shadow">

        <h2 className="mb-2 font-bold">
          🧠 AI Assistant
        </h2>

        <div className="flex gap-2">

          <input
            className="w-full rounded border p-2"
            placeholder="Describe project..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />

          <button
            onClick={handleAIGenerate}
            className="rounded bg-purple-600 px-4 py-2 text-white"
          >
            {aiLoading ? "..." : "AI"}
          </button>

        </div>

      </div>

      {/* ➕ CREATE TASK */}
      <div className="flex gap-2">

        <input
          className="w-full rounded border p-2"
          placeholder="New task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <button
          onClick={() => {
            createTask(title);
            setTitle("");
          }}
          className="rounded bg-black px-4 py-2 text-white"
        >
          Add
        </button>

      </div>

      {/* 📋 KANBAN */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >

        <div className="grid grid-cols-3 gap-4">

          {columns.map((col) => (
            <div
              key={col.id}
              className="min-h-[400px] rounded-lg bg-gray-100 p-3"
            >

              <h2 className="mb-3 font-bold">
                {col.title}
              </h2>

              {grouped[col.id as keyof typeof grouped].map((task) => (
                <div
                  key={task.id}
                  className="mb-2 rounded bg-white p-3 shadow"
                >

                  <div className="font-medium">
                    {task.title}
                  </div>

                  <div className="mt-3 flex gap-2">

                    <button
                      onClick={() => handleImprove(task)}
                      className="rounded bg-blue-500 px-2 py-1 text-xs text-white"
                    >
                      Improve (Улучшить)
                    </button>

                    <button
                      onClick={() => handleBreakDown(task)}
                      className="rounded bg-purple-500 px-2 py-1 text-xs text-white"
                    >
                      Break down (Разбить)
                    </button>

                  </div>

                </div>
              ))}

            </div>
          ))}

        </div>

      </DndContext>

    </div>
  );
}