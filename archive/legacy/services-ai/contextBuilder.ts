import { getProjectMemory } from "./memory";
import { supabase } from "@/services/supabase";

/**
 * 🧠 AI CONTEXT BUILDER
 * 👉 собирает “память проекта”
 */
export async function buildAIContext(projectId: string) {
  const memory = await getProjectMemory(projectId);

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId);

  const context = {
    tasks,
    memory,
  };

  return JSON.stringify(context, null, 2);
}