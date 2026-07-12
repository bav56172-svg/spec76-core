"use client";

import { useState } from "react";

export default function MetaConsciousnessPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runMeta() {
    setLoading(true);

    const res = await fetch("/api/ai/meta-consciousness", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        universe: {
          civilizations: [{ name: "Seed Civ" }],
        },
        history: [],
        metrics: {
          users: 100,
          growth: "high",
          stability: "stable",
        },
        aiState: {
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
            🧠 AI Meta-Consciousness System
          </h1>
          <p className="text-gray-500">
            Система, наблюдающая саму себя
          </p>
        </div>

        <button
          onClick={runMeta}
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          🧠 Run Self-Reflection
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-gray-500">
          Система анализирует собственное сознание...
        </div>
      )}

      {/* RESULT */}
      {data && (
        <div className="space-y-6">

          {/* CONSCIOUSNESS STATE */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="text-xl font-bold">
              🧠 Consciousness State
            </h2>
            <p>{data.consciousness_state}</p>
          </div>

          {/* SELF OBSERVATION */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">🪞 Self Observation</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.self_observation, null, 2)}
            </pre>
          </div>

          {/* MODIFICATION */}
          <div className="rounded-lg bg-yellow-50 p-4 shadow">
            <h2 className="font-bold text-yellow-700">
              🔁 Self Modification Plan
            </h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.self_modification_plan, null, 2)}
            </pre>
          </div>

          {/* NEW RULES */}
          <div className="rounded-lg bg-purple-50 p-4 shadow">
            <h2 className="font-bold text-purple-700">
              📜 New Rules (Reflection Output)
            </h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.new_rules, null, 2)}
            </pre>
          </div>

          {/* UNIVERSE */}
          <div className="rounded-lg bg-blue-50 p-4 shadow">
            <h2 className="font-bold text-blue-700">
              🌌 Universe State
            </h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.universe, null, 2)}
            </pre>
          </div>

        </div>
      )}

    </div>
  );
}