"use client";

import { useState } from "react";

export default function CivilizationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runCivilization() {
    setLoading(true);

    const res = await fetch("/api/ai/civilization", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ecosystem: {
          products: [
            { title: "Project AI" },
            { title: "Revenue AI" },
            { title: "Market AI" },
          ],
        },
        globalUsers: [],
        globalUsage: {},
        globalRevenue: {},
        policies: [],
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
            🌍 AI Digital Civilization
          </h1>
          <p className="text-gray-500">
            Полная симуляция цифрового мира
          </p>
        </div>

        <button
          onClick={runCivilization}
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          🌍 Run Civilization
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-gray-500">
          Цивилизация эволюционирует...
        </div>
      )}

      {/* RESULT */}
      {data && (
        <div className="space-y-6">

          {/* STATUS */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="text-xl font-bold">
              🌍 Civilization Status
            </h2>
            <p>{data.civilization_status}</p>
          </div>

          {/* GOVERNMENT */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">⚖️ Government AI</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.government, null, 2)}
            </pre>
          </div>

          {/* ECONOMY */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">💰 Economy</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.economy, null, 2)}
            </pre>
          </div>

          {/* MARKET */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">📊 Market</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.market, null, 2)}
            </pre>
          </div>

          {/* ECOSYSTEM */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">🌐 Ecosystem</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.ecosystem, null, 2)}
            </pre>
          </div>

          {/* COMPANIES */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">🏢 Companies</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data.companies, null, 2)}
            </pre>
          </div>

        </div>
      )}

    </div>
  );
}