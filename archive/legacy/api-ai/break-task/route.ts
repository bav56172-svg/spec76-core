import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const { title } = await req.json();

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Разбей задачу на подзадачи.

Верни ТОЛЬКО JSON массив строк:
[
  "шаг 1",
  "шаг 2"
]
        `,
      },
      {
        role: "user",
        content: title,
      },
    ],
  });

  let tasks: string[] = [];

  try {
    tasks = JSON.parse(res.choices[0].message.content || "[]");
  } catch {
    tasks = [];
  }

  return NextResponse.json({ tasks });
}