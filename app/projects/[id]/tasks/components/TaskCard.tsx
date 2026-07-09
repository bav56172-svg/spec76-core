"use client";

import { useState } from "react";

type Task = {
  id: string;
  title: string;
  description?: string;
  status?: string;
};

export default function TaskCard({ task }: { task: Task }) {
  // 🧠 AI STATE
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // 🧠 AGENT STATE (NEW)
  const [agentReport, setAgentReport] = useState<any>(null);
  const [agentLoading, setAgentLoading] = useState(false);

  // 🚀 AI ANALYZE TASK
  async function analyzeTask() {
    setAiLoading(true);

    try {
      const res = await fetch("/api/ai/task-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task }),
      });

      const data = await res.json();
      setAiAnalysis(data);
    } catch (err) {
      console.error(err);
    }

    setAiLoading(false);
  }

  // 🟢 AGENT CONTROL EXECUTION (NEW CORE LAYER)
  async function runAgentCheck() {
    setAgentLoading(true);

    try {
      const res = await fetch("/api/agents/task-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task, aiAnalysis }),
      });

      const data = await res.json();
      setAgentReport(data);
    } catch (err) {
      console.error(err);
    }

    setAgentLoading(false);
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      {/* 🟢 TASK HEADER */}
      <div className="mb-2">
        <h3 className="text-lg font-semibold">{task.title}</h3>
        {task.description && (
          <p className="text-sm text-gray-600">{task.description}</p>
        )}
      </div>

      {/* 🧠 AI LAYER */}
      <div className="mt-3 rounded-md border bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-purple-700">
            🧠 SPEC76 AI Engine
          </span>

          <button
            onClick={analyzeTask}
            className="rounded bg-purple-600 px-3 py-1 text-sm text-white"
          >
            {aiLoading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {aiAnalysis && (
          <div className="mt-2 text-xs text-gray-700">
            <div>
              <strong>Steps:</strong>
              <ul className="ml-4 list-disc">
                {aiAnalysis.steps?.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 🟢 AGENT CONTROL LAYER (NEW CORE SYSTEM) */}
      <div className="mt-3 rounded-md border bg-yellow-50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-orange-700">
            🛡 Agent Control Layer
          </span>

          <button
            onClick={runAgentCheck}
            className="rounded bg-orange-600 px-3 py-1 text-sm text-white"
          >
            {agentLoading ? "Checking..." : "Run Agents"}
          </button>
        </div>

        {/* 🟡 AGENT OUTPUT */}
        {agentReport && (
          <div className="mt-2 text-xs text-gray-800">
            {/* QA AGENT */}
            {agentReport.qa && (
              <div className="mb-2">
                <strong>QA:</strong> {agentReport.qa.status}
              </div>
            )}

            {/* SAFETY AGENT */}
            {agentReport.safety && (
              <div className="mb-2 text-red-600">
                <strong>Safety:</strong> {agentReport.safety.level}
              </div>
            )}

            {/* COMPLIANCE */}
            {agentReport.compliance && (
              <div className="mb-2 text-blue-600">
                <strong>Compliance:</strong>{" "}
                {agentReport.compliance.passed ? "OK" : "ISSUE"}
              </div>
            )}

            {/* FULL DEBUG */}
            <pre className="mt-2 whitespace-pre-wrap text-gray-500">
              {JSON.stringify(agentReport, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* 🟢 FOOTER */}
      <div className="mt-3 text-xs text-gray-400">
        Task ID: {task.id}
      </div>
    </div>
  );
}