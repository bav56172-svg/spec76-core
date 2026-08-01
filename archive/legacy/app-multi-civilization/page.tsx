"use client";

import { useState } from "react";

export default function MultiCivilizationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runNetwork() {
    setLoading(true);

    const res = await fetch("/api/ai/multi-civilization", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        civilizations: [
          {
            ecosystem: {
              products: [{ title: "Civ A AI" }],
            },
            policies: [],
          },
          {
            ecosystem: {
              products: [{ title: "Civ B AI" }],
            },
            policies: [],
          },
          {
            ecosystem: {
              products: [{ title: "Civ C AI" }],
            },
            policies: [],
          },
        ],
        globalUsers: [],
        globalMarketData: {
          usage: {},
          revenue: {},
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
            🌌 Multi-Civilization Network
          </h1>
          <p className="text-gray-500">
            Сеть взаимодействующих цифровых цивилизаций
          </p>
        </div>

        <button
          onClick={runNetwork}
          className="rounded bg-indigo-800 px-4 py-2 text-white hover:bg-indigo-900"
        >
          🌌 Run Network Simulation
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-gray-500">
          Сеть цивилизаций взаимодействует...
        </div>
      )}

      {/* RESULT */}
      {data && (
        <div className="space-y-6">

          {/* STATUS */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="text-xl font-bold">
              🌌 Network Status
            </h2>
            <p>{data.network_status}</p>
          </div>

          {/* CIVILIZATIONS */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">🌍 Civilizations</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.civilizations, null, 2)}
            </pre>
          </div>

          {/* INTER MARKET */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">🔄 Inter-Civilization Market</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.inter_civilization_market, null, 2)}
            </pre>
          </div>

          {/* GOVERNANCE */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">⚖️ Meta Governance</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.governance, null, 2)}
            </pre>
          </div>

        </div>
      )}

    </div>
  );
}