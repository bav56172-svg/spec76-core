import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * 🧠 теперь AI ВОЗВРАЩАЕТ JSON
 */
export async function generateTasksFromPrompt(prompt: string) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Ты AI ассистент для Kanban системы.

Верни ТОЛЬКО JSON массив задач.

Формат:
[
  "задача 1",
  "задача 2"
]

Никакого текста, только JSON.
        `,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = res.choices[0].message.content || "[]";

  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}
