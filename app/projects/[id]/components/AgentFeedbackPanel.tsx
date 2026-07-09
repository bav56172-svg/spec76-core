"use client";

import { useEffect, useState } from "react";

type AgentEvent = {
  id: string;
  agent: "QA" | "Safety" | "Compliance" | "DataIntegrity";
  status: "running" | "passed" | "failed" | "warning";
  message: string;
  timestamp: number;
};

export default function AgentFeedbackPanel({
  taskId,
}: {
  taskId: string | null;
}) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!taskId) return;

    // 🟢 REALTIME SIMULATION (позже заменим на WebSocket)
    const interval = setInterval(() => {
      const mockEvent: AgentEvent = {
        id: Math.random().toString(36),
        agent: ["QA", "Safety", "Compliance", "DataIntegrity"][
          Math.floor(Math.random() * 4)
        ] as any,
        status: ["running", "passed", "warning"][
          Math.floor(Math.random() * 3)
        ] as any,
        message: "Analyzing task context...",
        timestamp: Date.now(),
      };

      setEvents((prev) => [mockEvent, ...prev].slice(0, 10));
      setConnected(true);
    }, 2000);

    return () => clearInterval(interval);
  }, [taskId]);

  return (
    <div className="rounded-lg border bg-white p-4 shadow">

      {/* 🟢 HEADER */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold">🧠 Agent Live Feedback</h2>

        <span
          className={`text-xs px-2 py-1 rounded ${
            connected ? "bg-green-100 text-green-700" : "bg-gray-100"
          }`}
        >
          {connected ? "LIVE" : "DISCONNECTED"}
        </span>
      </div>

      {/* 🟢 EVENTS STREAM */}
      <div className="space-y-2 max-h-[300px] overflow-auto">

        {events.map((event) => (
          <div
            key={event.id}
            className="rounded border p-2 text-sm flex justify-between"
          >

            <div>
              <div className="font-medium">
                {event.agent}
              </div>

              <div className="text-gray-500">
                {event.message}
              </div>
            </div>

            <div className="text-xs">
              <span
                className={
                  event.status === "passed"
                    ? "text-green-600"
                    : event.status === "warning"
                    ? "text-yellow-600"
                    : "text-blue-600"
                }
              >
                {event.status}
              </span>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}