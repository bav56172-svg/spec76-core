import OpenAI from "openai";
import type { Project } from "@/types/project";
import { getProjectMemory } from "./memory";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateTasksWithGPT(project: Project) {
  const memory = await getProjectMemory(project.id);

  const memoryText = memory
    .map((m) => `- ${m.content}`)
    .join("\n");

  const prompt = `
Ты AI-ассистент системы SPEC76 OS.

## ПРОЕКТ
Название: ${project?.title}
Описание: ${project?.description}

## ПАМЯТЬ ПРОЕКТА (важно)
${memoryText || "память пока пустая"}

## ЗАДАЧА
Сгенерируй задачи для проекта.

Верни JSON:
[
  {
    "title": "",
    "description": "",
    "status": "todo"
  }
]
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Ты AI, который использует память проекта для принятия решений.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = response.choices[0].message.content || "[]";

  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}
