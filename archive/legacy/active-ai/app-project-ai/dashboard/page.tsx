"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AIObservabilityLayer } from "@/lib/ai/observabilityLayer";

/**
 * 🧠 AI CONTROL DASHBOARD
 * central control panel for entire AI system
 */
export default function AIDashboardPage() {
  const { id } = useParams();

  const [health, setHealth] = useState<any>(null);
  const [trace, setTrace] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * 🧠 LOAD SYSTEM DATA
   */
  async function loadData() {
    setLoading(true);

    /**
     * 📊 SYSTEM HEALTH
     */
    const systemHealth =
      AIObservabilityLayer.getSystemHealth(id as string);

    /**
     * 📦 TRACE LOGS
     */
    const systemTrace =
      AIObservabilityLayer.getTrace(id as string);

    setHealth(systemHealth);
    setTrace(systemTrace);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [id]);

  return (
    <div className="space-y-6 p-6">

      {/* 🟢 HEADER */}
      <div className="rounded-lg border bg-black p-4 text-white shadow">
        <h1 className="text-xl font-bold">
          🧠 AI Control Dashboard
        </h1>

        <p className="text-sm text-gray-300">
          System observability & control center
        </p>
      </div>

      {/* 📊 SYSTEM HEALTH */}
      <div className="rounded-lg border bg-white p-4 shadow">

        <div className="flex items-center justify-between">
          <h2 className="font-bold">
            📊 System Health
          </h2>

          <button
            onClick={loadData}
            className="rounded bg-black px-3 py-1 text-sm text-white"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {health && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">

            <div className="rounded border p-3">
              <div className="text-gray-500">
                Stability Score
              </div>
              <div className="text-xl font-bold">
                {health.stabilityScore}%
              </div>
            </div>

            <div className="rounded border p-3">
              <div className="text-gray-500">
                Total Actions
              </div>
              <div className="text-xl font-bold">
                {health.actionsTotal}
              </div>
            </div>

            <div className="rounded border p-3">
              <div className="text-green-600">
                Accepted
              </div>
              <div className="text-xl font-bold">
                {health.accepted}
              </div>
            </div>

            <div className="rounded border p-3">
              <div className="text-red-600">
                Rejected
              </div>
              <div className="text-xl font-bold">
                {health.rejected}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 🤖 TRACE LOG */}
      <div className="rounded-lg border bg-white p-4 shadow">

        <h2 className="font-bold">
          🔍 AI Decision Trace
        </h2>

        <div className="mt-4 space-y-2 max-h-[400px] overflow-auto">

          {trace.length === 0 && (
            <p className="text-sm text-gray-500">
              No trace data (нет логов)
            </p>
          )}

          {trace.map((event, idx) => (
            <div
              key={idx}
              className="rounded border p-2 text-sm"
            >
              <div className="font-semibold">
                {event.type}
              </div>

              <div className="text-gray-600">
                {event.message}
              </div>

              <div className="text-xs text-gray-400">
                {new Date(event.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}

        </div>

      </div>

      {/* 🧠 RAW SYSTEM VIEW */}
      <div className="rounded-lg border bg-gray-50 p-4 shadow">

        <h2 className="font-bold">
          🧠 Raw System State
        </h2>

        <pre className="mt-3 overflow-auto text-xs">
          {JSON.stringify(
            { health, trace },
            null,
            2
          )}
        </pre>

      </div>

    </div>
  );
}