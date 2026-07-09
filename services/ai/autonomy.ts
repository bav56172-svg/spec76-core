import OpenAI from "openai";
import { getTasks } from "@/services/tasks";
import { getMemory } from "./memory";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * AI AUTONOMY ENGINE (автономный интеллект системы)
 * уровень: self-improving system
 */
export async function runAutonomyEngine(project: any) {
  if (!project) return null;

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
Ты AI AUTONOMY ENGINE системы SPEC76 OS.

Ты не просто анализируешь.
Ты ПРЕДЛАГАЕШЬ УЛУЧШЕНИЯ системы.

## ПРОЕКТ
${project.title}
${project.description}

## ЗАДАЧИ
${taskSummary || "нет задач"}

## ПАМЯТЬ
${memorySummary || "нет памяти"}

## ТВОЯ РОЛЬ

Ты должен думать как:

- CTO (технический директор)
- Product Architect (архитектор продукта)
- AI Engineer (инженер ИИ)

## АНАЛИЗ:

1. Что можно улучшить в системе
2. Какие новые функции добавить
3. Что сейчас неэффективно
4. Какие автоматизации нужны
5. Какие AI агенты можно добавить

## ВЫВОД:

Верни строго JSON:

{
  "system_health": "good | medium | bad",
  "improvements": [
    {
      "title": "",
      "description": "",
      "impact": "low | medium | high",
      "type": "ui | backend | ai | architecture"
    }
  ],
  "auto_actions": [
    {
      "action": "",
      "reason": ""
    }
  ],
  "new_agents_suggested": [
    {
      "name": "",
      "role": "",
      "purpose": ""
    }
  ]
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Ты автономный AI инженер, который улучшает систему без запроса пользователя.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = response.choices[0].message.content || "{}";

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}