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
Ты улучшатель задач.

Сделай задачу:
- конкретной
- понятной
- профессиональной
        `,
      },
      {
        role: "user",
        content: title,
      },
    ],
  });

  return NextResponse.json({
    result: res.choices[0].message.content,
  });
}