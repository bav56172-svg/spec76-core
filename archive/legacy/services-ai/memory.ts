import { supabase } from "@/services/supabase";

interface SaveMemoryInput {
  projectId: string;
  type: string;
  content: string;
}

/**
 * 🧠 SAVE MEMORY
 */
export async function saveMemory({
  projectId,
  type,
  content,
}: SaveMemoryInput) {
  await supabase.from("ai_memory").insert({
    project_id: projectId,
    type,
    content,
  });
}

/**
 * 📦 GET PROJECT MEMORY
 */
export async function getProjectMemory(projectId: string) {
  const { data } = await supabase
    .from("ai_memory")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);

  return data || [];
}
