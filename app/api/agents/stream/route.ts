import { NextRequest } from "next/server";

type AgentType = "QA" | "Safety" | "Compliance" | "DataIntegrity";

type AgentEvent = {
  agent: AgentType;
  status: "running" | "passed" | "warning" | "failed";
  message: string;
  taskId: string;
  timestamp: number;
};

// 🟢 SIMULATED AGENT EXECUTION (replace with real AI later)
async function runAgent(agent: AgentType, taskId: string) {
  const steps = [
    "Loading task context",
    "Analyzing requirements",
    "Checking constraints",
    "Validating output",
  ];

  for (const step of steps) {
    await new Promise((r) => setTimeout(r, 600));

    const event: AgentEvent = {
      agent,
      status: "running",
      message: `${agent}: ${step}`,
      taskId,
      timestamp: Date.now(),
    };

    yield event;
  }

  return {
    agent,
    status: Math.random() > 0.2 ? "passed" : "warning",
    message: `${agent} completed`,
    taskId,
    timestamp: Date.now(),
  } as AgentEvent;
}

// 🟢 STREAM ENDPOINT (SSE STYLE)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");

  if (!taskId) {
    return new Response("Missing taskId", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const agents: AgentType[] = [
        "QA",
        "Safety",
        "Compliance",
        "DataIntegrity",
      ];

      for (const agent of agents) {
        const steps = [
          "Initializing",
          "Processing",
          "Validating",
        ];

        for (const step of steps) {
          const event: AgentEvent = {
            agent,
            status: "running",
            message: `${agent}: ${step}`,
            taskId,
            timestamp: Date.now(),
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );

          await new Promise((r) => setTimeout(r, 500));
        }

        const finalEvent: AgentEvent = {
          agent,
          status: Math.random() > 0.2 ? "passed" : "warning",
          message: `${agent} finished execution`,
          taskId,
          timestamp: Date.now(),
        };

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(finalEvent)}\n\n`)
        );
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}