import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/services/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * 🧠 AI TASK GENERATOR + MEMORY CONTEXT
 */
export async function POST(req: Request) {
  try {
    const { prompt, projectId } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "No prompt provided" },
        { status: 400 }
      );
    }

    /**
     * 🧠 LOAD MEMORY (tasks + history)
     */
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId);

    const { data: memory } = await supabase
      .from("ai_memory")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(30);

    const context = {
      tasks: tasks || [],
      memory: memory || [],
    };

    /**
     * 🧠 AI CALL WITH MEMORY CONTEXT
     */
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Ты AI проектный менеджер.

У тебя есть контекст проекта:

${JSON.stringify(context)}

Правила:
- не дублируй задачи
- учитывай уже существующие задачи
- используй историю памяти
- возвращай ТОЛЬКО JSON массив задач
          `,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text = completion.choices[0].message.content || "[]";

    let result: string[] = [];

    try {
      result = JSON.parse(text);
    } catch {
      result = [];
    }

    return NextResponse.json({ tasks: result });
  } catch (error) {
    return NextResponse.json(
      { error: "AI error" },
      { status: 500 }
    );
  }
}