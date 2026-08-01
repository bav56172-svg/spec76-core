import OpenAI from "openai";
import { getMemory, saveMemory } from "@/services/ai/memory";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const body = await req.json();

  const project = body.project;
  const message = body.message;

  const memoryRes = await getMemory(project.id);
  const memory = memoryRes.data ?? [];

  const memoryText = memory
    .map((m) => `- ${m.content}`)
    .join("\n");

  const prompt = `
Ты AI-ассистент проекта SPEC76 OS.

## ПАМЯТЬ ПРОЕКТА
${memoryText || "память пуста"}

## ПРОЕКТ
${project?.title}

## ВОПРОС
${message}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Ты AI с долговременной памятью проекта.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const reply = completion.choices[0].message.content;

  // 🧠 СОХРАНЯЕМ В ПАМЯТЬ ВАЖНЫЕ ФАКТЫ
  await saveMemory(project.id, message, "user_note");
  await saveMemory(project.id, reply || "", "ai_note");

  return Response.json({
    reply,
  });
}