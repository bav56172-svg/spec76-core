import OpenAI from "openai";
import { getProjectMemory, saveMemory } from "@/services/ai/memory";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const body = await req.json();

  const project = body.project;
  const message = body.message;

  const memory = await getProjectMemory(project.id);

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
  await saveMemory({
    projectId: project.id,
    type: "user_note",
    content: message,
  });
  await saveMemory({
    projectId: project.id,
    type: "ai_note",
    content: reply || "",
  });

  return Response.json({
    reply,
  });
}
