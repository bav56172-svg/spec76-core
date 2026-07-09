import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/services/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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
     * 🧠 LOAD PROJECT STATE
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
     * 🧠 AUTOPILOT ANALYSIS
     */
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Ты AI AUTOPILOT системы управления проектами.

Твоя задача:
- анализировать проект
- находить проблемы
- предлагать действия

Формат ответа строго JSON:

{
  "insights": ["..."],
  "problems": ["..."],
  "actions": ["..."]
}

НЕ ПИШИ ТЕКСТ, только JSON.
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
      result = {
        insights: [],
        problems: [],
        actions: [],
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Autopilot error" },
      { status: 500 }
    );
  }
}