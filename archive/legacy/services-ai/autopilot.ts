import OpenAI from "openai";
import { getTasks } from "@/services/tasks";
import type { Project } from "@/types/project";
import { getProjectMemory } from "./memory";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * AI AUTOPILOT (автопилот проекта)
 * анализирует проект как менеджер
 */
export async function runAutopilot(project: Project | null | undefined) {
  if (!project) return null;

  // 📦 1. получаем задачи
  const tasksRes = await getTasks(project.id);
  const tasks = tasksRes.data ?? [];

  // 🧠 2. получаем память проекта
  const memory = await getProjectMemory(project.id);

  const taskSummary = tasks
    .map((t) => `- ${t.title} [${t.status}]`)
    .join("\n");

  const memorySummary = memory
    .map((m) => `- ${m.content}`)
    .join("\n");

  const prompt = `
Ты AI Project Manager (менеджер проекта уровня senior).

## ПРОЕКТ
Название: ${project.title}
Описание: ${project.description}

## ЗАДАЧИ
${taskSummary || "задач нет"}

## ПАМЯТЬ ПРОЕКТА
${memorySummary || "память пустая"}

## ТВОЯ ЗАДАЧА
Проанализируй проект и дай:

1. Что сейчас НЕ хватает
2. Что блокирует прогресс
3. Какие следующие шаги
4. Какие задачи нужно добавить
5. Риски проекта

Верни ответ строго в JSON:

{
  "summary": "",
  "blockers": [],
  "next_actions": [],
  "new_tasks": [
    {
      "title": "",
      "description": "",
      "status": "todo"
    }
  ],
  "risks": []
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Ты AI автопилот проекта. Ты как senior product manager и tech lead.",
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
