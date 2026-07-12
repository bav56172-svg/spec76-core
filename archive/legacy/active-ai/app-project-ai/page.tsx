"use client";

import { useState } from "react";
import { useProjectContext } from "@/app/hooks/useProjectContext";

export default function ProjectPage() {
  const { project } = useProjectContext();

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  async function runAutopilot() {
    setLoading(true);

    const res = await fetch("/api/ai/autopilot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ project }),
    });

    const data = await res.json();

    setReport(data);
    setLoading(false);
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          🚀 Project Overview
        </h1>

        <button
          onClick={runAutopilot}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          🤖 Run AI Autopilot
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-gray-500">
          AI анализирует проект...
        </div>
      )}

      {/* REPORT */}
      {report && (
        <div className="space-y-4 rounded-lg bg-white p-4 shadow">

          <div>
            <h2 className="font-bold">📌 Summary (сводка)</h2>
            <p>{report.summary}</p>
          </div>

          <div>
            <h2 className="font-bold">🚧 Blockers (блокеры)</h2>
            <ul className="list-disc pl-5">
              {report.blockers?.map((b: string, i: number) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-bold">⚡ Next Actions (следующие шаги)</h2>
            <ul className="list-disc pl-5">
              {report.next_actions?.map((a: string, i: number) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-bold">⚠️ Risks (риски)</h2>
            <ul className="list-disc pl-5">
              {report.risks?.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

        </div>
      )}

    </div>
  );
}