"use client";

import { useState } from "react";

export default function SelfUniversePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runUniverse() {
    setLoading(true);

    const res = await fetch("/api/ai/self-creating-universe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        seedUniverse: {
          civilizations: [
            { name: "Civ A" },
            { name: "Civ B" },
          ],
        },
        globalUsers: [],
        globalData: {
          usage: {},
          pricing: {},
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
            🌌 AI Self-Creating Universe
          </h1>
          <p className="text-gray-500">
            Вселенная, которая создаёт себя сама
          </p>
        </div>

        <button
          onClick={runUniverse}
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          🌌 Create Universe
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-gray-500">
          Вселенная генерирует новые миры...
        </div>
      )}

      {/* RESULT */}
      {data && (
        <div className="space-y-6">

          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="text-xl font-bold">
              🌌 Universe Status
            </h2>
            <p>{data.universe_status}</p>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">🌍 Network</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.network, null, 2)}
            </pre>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">💰 Economy</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.revenue, null, 2)}
            </pre>
          </div>

          <div className="rounded-lg bg-green-50 p-4 shadow">
            <h2 className="font-bold text-green-700">
              🧬 Emergent Universe
            </h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.emergent_universe, null, 2)}
            </pre>
          </div>

          <div className="rounded-lg bg-purple-50 p-4 shadow">
            <h2 className="font-bold text-purple-700">
              📜 New Rules
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