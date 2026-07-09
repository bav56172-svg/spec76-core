"use client";

import { useEffect, useState } from "react";

export default function ProjectExecutionPage() {
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [activeTask, setActiveTask] = useState<any>(null);

  // 🟢 LOAD PROJECT
  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch("/api/projects/current");
        const data = await res.json();

        setProject(data.project);
        setTasks(data.tasks || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, []);

  // 🟢 AI TASK GENERATION
  async function handleAIGenerate() {
    if (!aiPrompt.trim()) return;

    setAiLoading(true);

    try {
      const res = await fetch("/api/ai/generate-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          projectId: project?.id,
        }),
      });

      const data = await res.json();

      setTasks((prev) => [...prev, ...(data.tasks || [])]);
      setAiPrompt("");
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  }

  // 🟢 RUN AGENTS CHECK
  async function runAgents(task: any) {
    const res = await fetch("/api/agents/task-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task,
      }),
    });

    return await res.json();
  }

  // 🟢 EXECUTE TASK FLOW
  async function executeTask(task: any) {
    setActiveTask(task);

    const agentResult = await runAgents(task);

    console.log("AGENT RESULT:", agentResult);

    // here later: human-in-loop + execution engine
  }

  if (loading) {
    return <div className="p-6">Loading project...</div>;
  }

  return (
    <div className="p-6 space-y-6">

      {/* 🟢 PROJECT HEADER */}
      <div className="rounded-lg border bg-white p-4 shadow">
        <h1 className="text-xl font-bold">
          {project?.name || "Project"}
        </h1>

        <p className="text-sm text-gray-500">
          SPEC76 Execution Dashboard
        </p>
      </div>

      {/* 🧠 AI INPUT */}
      <div className="rounded-lg border bg-white p-4 shadow">
        <h2 className="font-bold mb-2">🧠 AI Task Generator</h2>

        <div className="flex gap-2">
          <input
            className="w-full rounded border p-2"
            placeholder="Describe what needs to be done..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />

          <button
            onClick={handleAIGenerate}
            className="rounded bg-purple-600 px-4 py-2 text-white"
          >
            {aiLoading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* 🟢 TASK BOARD */}
      <div className="grid grid-cols-3 gap-4">

        {/* TODO */}
        <div className="rounded border bg-gray-50 p-3">
          <h3 className="font-bold mb-2">Todo</h3>

          {tasks
            .filter((t) => t.status === "todo")
            .map((task) => (
              <div
                key={task.id}
                className="mb-2 rounded bg-white p-2 shadow"
              >
                <p className="font-medium">{task.title}</p>

                <button
                  onClick={() => executeTask(task)}
                  className="mt-2 text-sm text-blue-600"
                >
                  Run Execution
                </button>
              </div>
            ))}
        </div>

        {/* IN PROGRESS */}
        <div className="rounded border bg-gray-50 p-3">
          <h3 className="font-bold mb-2">In Progress</h3>

          {tasks
            .filter((t) => t.status === "in_progress")
            .map((task) => (
              <div
                key={task.id}
                className="mb-2 rounded bg-white p-2 shadow"
              >
                <p>{task.title}</p>
              </div>
            ))}
        </div>

        {/* DONE */}
        <div className="rounded border bg-gray-50 p-3">
          <h3 className="font-bold mb-2">Done</h3>

          {tasks
            .filter((t) => t.status === "done")
            .map((task) => (
              <div
                key={task.id}
                className="mb-2 rounded bg-white p-2 shadow"
              >
                <p>{task.title}</p>
              </div>
            ))}
        </div>
      </div>

      {/* 🧠 ACTIVE TASK DEBUG PANEL */}
      {activeTask && (
        <div className="rounded border bg-white p-4 shadow">
          <h2 className="font-bold">Active Task Execution</h2>

          <pre className="mt-2 text-xs bg-gray-100 p-2 overflow-auto">
            {JSON.stringify(activeTask, null, 2)}
          </pre>
        </div>
      )}

    </div>
  );
}