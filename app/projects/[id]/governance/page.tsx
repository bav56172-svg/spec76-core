"use client";

import { useEffect, useState } from "react";

type Approval = {
  id: string;
  action: string;
  risk: "low" | "medium" | "high" | "critical";
  status: "pending" | "approved" | "rejected";
};

type AgentEvent = {
  agent: string;
  message: string;
  status: string;
  timestamp: number;
};

export default function GovernanceDashboard() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // 🟢 LOAD GOVERNANCE DATA
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/governance/state");
      const data = await res.json();

      setApprovals(data.approvals || []);
      setAgentEvents(data.events || []);
      setLoading(false);
    }

    load();
  }, []);

  // 🟢 ACTION HANDLER
  async function resolveApproval(id: string, status: "approved" | "rejected") {
    await fetch("/api/governance/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status } : a
      )
    );
  }

  if (loading) {
    return <div className="p-6">Loading governance dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">

      {/* 🟢 HEADER */}
      <div className="rounded-lg border bg-white p-4 shadow">
        <h1 className="text-xl font-bold">
          🧠 SPEC76 Governance Control Center
        </h1>
        <p className="text-sm text-gray-500">
          Human-in-the-loop (человек в контуре управления)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">

        {/* 🟢 APPROVAL QUEUE */}
        <div className="rounded border bg-white p-4 shadow">
          <h2 className="font-bold mb-3">
            🚨 Approval Queue (очередь подтверждений)
          </h2>

          {approvals.map((a) => (
            <div
              key={a.id}
              className="border rounded p-2 mb-2"
            >
              <p className="font-medium">{a.action}</p>

              <p className="text-xs text-gray-500">
                Risk (риск): {a.risk}
              </p>

              <p className="text-xs">
                Status (статус): {a.status}
              </p>

              {a.status === "pending" && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => resolveApproval(a.id, "approved")}
                    className="bg-green-600 text-white px-2 py-1 text-xs rounded"
                  >
                    Approve (одобрить)
                  </button>

                  <button
                    onClick={() => resolveApproval(a.id, "rejected")}
                    className="bg-red-600 text-white px-2 py-1 text-xs rounded"
                  >
                    Reject (отклонить)
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 🟢 AGENT ACTIVITY */}
        <div className="rounded border bg-white p-4 shadow">
          <h2 className="font-bold mb-3">
            🧠 Agent Activity (активность агентов)
          </h2>

          <div className="max-h-[400px] overflow-auto space-y-2">
            {agentEvents.map((e, i) => (
              <div key={i} className="border p-2 rounded">
                <p className="font-medium">{e.agent}</p>
                <p className="text-sm text-gray-600">
                  {e.message}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(e.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🟢 SYSTEM STATUS */}
      <div className="rounded border bg-gray-50 p-4">
        <h2 className="font-bold mb-2">
          ⚙️ System Status (состояние системы)
        </h2>

        <ul className="text-sm space-y-1">
          <li>✔ Execution Engine (движок выполнения)</li>
          <li>✔ Agent System (система агентов)</li>
          <li>✔ Memory Learning Loop (контур памяти)</li>
          <li>✔ Governance Layer (уровень управления)</li>
          <li>✔ Realtime Stream (поток событий)</li>
        </ul>
      </div>

    </div>
  );
}