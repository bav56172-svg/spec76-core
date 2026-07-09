"use client";

import { useState } from "react";

export default function EcosystemPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runEcosystem() {
    setLoading(true);

    const res = await fetch("/api/ai/ecosystem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products: [
          { title: "Project AI", description: "task system" },
          { title: "Revenue AI", description: "monetization" },
        ],
        globalUsers: [],
        globalUsage: {},
        globalRevenue: {},
      }),
    });

    const result = await res.json();

    setData(result);
    setLoading(false);
  }

  return (
    <div className="space-y-6 p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            🌐 AI Ecosystem Control Center
          </h1>
          <p className="text-gray-500">
            Полное управление всеми AI продуктами
          </p>
        </div>

        <button
          onClick={runEcosystem}
          className="rounded bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-800"
        >
          🌐 Run Ecosystem Analysis
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-gray-500">
          AI Ecosystem анализирует всю систему...
        </div>
      )}

      {/* RESULT */}
      {data && (
        <div className="space-y-6">

          {/* STATUS */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="text-xl font-bold">
              🌐 Ecosystem Status
            </h2>
            <p>{data.ecosystem_status}</p>
          </div>

          {/* MARKET */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">📊 Market Layer</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.market, null, 2)}
            </pre>
          </div>

          {/* REVENUE */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">💰 Revenue Layer</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.revenue, null, 2)}
            </pre>
          </div>

          {/* COMPANIES */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">🏢 Companies</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.companies, null, 2)}
            </pre>
          </div>

          {/* GOVERNANCE */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">⚖️ Governance</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.governance, null, 2)}
            </pre>
          </div>

        </div>
      )}

    </div>
  );
}