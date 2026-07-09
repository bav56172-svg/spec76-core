import OpenAI from "openai";
import { getTasks } from "@/services/tasks";
import { getMemory } from "@/services/ai/memory";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * REAL-TIME AI ENGINE
 */
export async function POST(req: Request) {
  const body = await req.json();

  const project = body.project;

  const tasksRes = await getTasks(project.id);
  const tasks = tasksRes.data ?? [];

  const memoryRes = await getMemory(project.id);
  const memory = memoryRes.data ?? [];

  const taskSummary = tasks
    .map((t) => `- ${t.title} [${t.status}]`)
    .join("\n");

  const memorySummary = memory
    .map((m) => `- ${m.content}`)
    .join("\n");

  const prompt = `
Ты REAL-TIME AI системы SPEC76 OS.

Ты постоянно наблюдаешь проект и даёшь live-аналитику.

## ПРОЕКТ
${project.title}

## ЗАДАЧИ
${taskSummary || "нет задач"}

## ПАМЯТЬ
${memorySummary || "память пустая"}

## ЗАДАЧА
Дай текущий статус системы:

1. состояние проекта
2. текущие проблемы
3. что важно сейчас
4. рекомендации в реальном времени

Верни JSON:

{
  "status": "",
  "insights": [],
  "alerts": [],
  "recommendations": []
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Ты живой AI монитор системы, работаешь в реальном времени.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = response.choices[0].message.content || "{}";

  try {
    return Response.json(JSON.parse(text));
  } catch {
    return Response.json({
      status: "error parsing response",
      insights: [],
      alerts: [],
      recommendations: [],
    });
  }
}