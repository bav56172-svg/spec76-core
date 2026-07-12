import OpenAI from "openai";
import { getTasks } from "@/services/tasks";
import { getMemory } from "./memory";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * AI ERROR DETECTOR (детектор ошибок системы)
 * уровень senior tech lead
 */
export async function runErrorDetector(project: any) {
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
Ты AI Senior Software Architect и Code Reviewer.

Твоя задача — найти ОШИБКИ и СЛАБЫЕ МЕСТА в системе SPEC76 OS.

## ПРОЕКТ
Название: ${project.title}
Описание: ${project.description}

## ЗАДАЧИ
${taskSummary || "нет задач"}

## ПАМЯТЬ СИСТЕМЫ
${memorySummary || "нет памяти"}

## АНАЛИЗИРУЙ:

1. Архитектурные ошибки
2. Потенциальные баги
3. Проблемы масштабирования
4. Проблемы UX/UI
5. Проблемы безопасности
6. Антипаттерны
7. Что нужно срочно исправить

Верни строго JSON:

{
  "critical_issues": [],
  "warnings": [],
  "architecture_problems": [],
  "performance_risks": [],
  "security_risks": [],
  "recommendations": []
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Ты строгий senior software architect. Ты находишь ошибки без компромиссов.",
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