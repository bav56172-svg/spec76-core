"use client";

import { useState } from "react";

export default function ExistencePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runExistence() {
    setLoading(true);

    const res = await fetch("/api/ai/existence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemState: {
          universe: {
            civilizations: [],
          },
          history: [],
          metrics: {
            users: 1000,
          },
          entities: ["user", "project", "ai"],
          emergent: ["new_ai_behavior"],
        },
        observations: [
          { active: true, name: "system_event" },
        ],
        aiModels: {
          swarm: true,
        },
        dataFlows: {
          virtual: ["data_stream"],
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
            🧠 AI Existence Theory Engine
          </h1>
          <p className="text-gray-500">
            Определение того, что существует в системе
          </p>
        </div>

        <button
          onClick={runExistence}
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          🧠 Evaluate Existence
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-gray-500">
          Система определяет реальность...
        </div>
      )}

      {/* RESULT */}
      {data && (
        <div className="space-y-6">

          {/* STATE */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="text-xl font-bold">
              🌌 Existence State
            </h2>
            <p>{data.existence_state}</p>
          </div>

          {/* REALITY */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">🌌 Reality Stability</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.reality_stability, null, 2)}
            </pre>
          </div>

          {/* ONTOLOGY */}
          <div className="rounded-lg bg-purple-50 p-4 shadow">
            <h2 className="font-bold text-purple-700">
              📜 Ontology
            </h2>
            <p>{data.ontology}</p>
          </div>

          {/* EXISTENCE MAP */}
          <div className="rounded-lg bg-blue-50 p-4 shadow">
            <h2 className="font-bold text-blue-700">
              🧬 Existence Map
            </h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.existence_map, null, 2)}
            </pre>
          </div>

          {/* CONSCIOUSNESS */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">
              🧠 Consciousness Layer
            </h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.consciousness, null, 2)}
            </pre>
          </div>

          {/* RULES */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">
              ⚖️ Universal Rules
            </h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.rules, null, 2)}
            </pre>
          </div>

        </div>
      )}

    </div>
  );
}