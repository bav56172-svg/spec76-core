import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/services/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * 🧠 AI AUTO ACTION ENGINE
 */
export async function POST(req: Request) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "No projectId" },
        { status: 400 }
      );
    }

    /**
     * 📦 LOAD CONTEXT
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
      .limit(50);

    const context = {
      tasks: tasks || [],
      memory: memory || [],
    };

    /**
     * 🧠 AI ACTION GENERATION
     */
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Ты AI AUTO ACTION SYSTEM.

Ты генерируешь ТОЛЬКО JSON.

ФОРМАТ:

{
  "actions": [
    {
      "type": "create_task | update_task | break_task | rename_task",
      "payload": {}
    }
  ]
}

ПРАВИЛА:
- не выполняй действия
- только предлагаешь
- действия должны быть безопасными
          `,
        },
        {
          role: "user",
          content: JSON.stringify(context),
        },
      ],
    });

    const text = completion.choices[0].message.content || "{}";

    let result;

    try {
      result = JSON.parse(text);
    } catch {
      result = { actions: [] };
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "AI actions error" },
      { status: 500 }
    );
  }
}