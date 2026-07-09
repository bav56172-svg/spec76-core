"use client";

import { useState } from "react";

export default function UniversalRulesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runRules() {
    setLoading(true);

    const res = await fetch("/api/ai/universal-rules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        universes: [
          { name: "Civilization A" },
          { name: "Civilization B" },
        ],
        civilizations: [],
        economyState: {},
        aiBehavior: {
          swarm: true,
          autonomy: true,
        },
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
            🌌 AI Universal Rule Engine
          </h1>
          <p className="text-gray-500">
            Законы цифровой вселенной
          </p>
        </div>

        <button
          onClick={runRules}
          className="rounded bg-purple-900 px-4 py-2 text-white hover:bg-purple-950"
        >
          🌌 Generate Laws
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-gray-500">
          Формируются законы вселенной...
        </div>
      )}

      {/* RESULT */}
      {data && (
        <div className="space-y-6">

          {/* STATE */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="text-xl font-bold">
              🌌 Universe State
            </h2>
            <p>{data.universe_state}</p>
          </div>

          {/* LAWS */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">📜 Laws</h2>

            {data.laws?.map((l: any, idx: number) => (
              <div key={idx} className="border p-3 mt-2">
                <b>{l.name}</b>
                <p>{l.description}</p>
                <span className="text-sm text-gray-500">
                  type: {l.type} | impact: {l.impact}
                </span>
              </div>
            ))}
          </div>

          {/* RULES */}
          <div className="rounded-lg bg-black text-white p-4 shadow">
            <h2 className="font-bold">
              ⚖️ System Rules
            </h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.system_rules, null, 2)}
            </pre>
          </div>

          {/* FORBIDDEN */}
          <div className="rounded-lg bg-red-50 p-4 shadow">
            <h2 className="font-bold text-red-600">
              🚫 Forbidden Actions
            </h2>
            <ul className="list-disc pl-5">
              {data.forbidden_actions?.map((a: string, idx: number) => (
                <li key={idx}>{a}</li>
              ))}
            </ul>
          </div>

          {/* EMERGENCE */}
          <div className="rounded-lg bg-green-50 p-4 shadow">
            <h2 className="font-bold text-green-700">
              🧬 Emergent Properties
            </h2>
            <ul className="list-disc pl-5">
              {data.emergent_properties?.map((e: string, idx: number) => (
                <li key={idx}>{e}</li>
              ))}
            </ul>
          </div>

        </div>
      )}

    </div>
  );
}