import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * SELF-MODIFYING AI ENGINE
 * предлагает изменения кода проекта (patch-based system)
 */
export async function runSelfModifyingAI(project: any, codebase: string) {
  if (!project) return null;

  const prompt = `
Ты SELF-MODIFYING AI системы SPEC76 OS.

Ты анализируешь код и предлагаешь ИЗМЕНЕНИЯ.

## ПРОЕКТ
${project.title}
${project.description}

## КОДОВАЯ БАЗА
${codebase}

## ЗАДАЧА

Ты должен:
1. Найти проблемы в коде
2. Предложить улучшения
3. Сформировать конкретные изменения

ВАЖНО:
- НЕ пиши общий текст
- Пиши только конкретные изменения кода
- Используй формат PATCH

## ФОРМАТ ОТВЕТА:

Верни строго JSON:

{
  "summary": "",
  "issues_found": [],
  "patches": [
    {
      "file": "",
      "change_type": "add | modify | delete",
      "description": "",
      "code": ""
    }
  ],
  "risk_level": "low | medium | high",
  "recommendation": ""
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Ты senior software architect, который умеет предлагать безопасные изменения кода.",
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
    return {
      summary: "error parsing response",
      issues_found: [],
      patches: [],
      risk_level: "high",
      recommendation: "manual review required",
    };
  }
}