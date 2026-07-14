import { supabase } from "@/services/supabase";
import type { Conversation, ConversationType } from "@/types/conversation";

export async function listProjectConversations(projectId: string) {
  return await supabase
    .from("conversations")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .returns<Conversation[]>();
}

export async function createProjectConversation(input: {
  project_id: string;
  title: string;
  conversation_type?: ConversationType;
}) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { data: null, error: authError ?? new Error("Пользователь не авторизован.") };
  }

  return await supabase
    .from("conversations")
    .insert({
      project_id: input.project_id,
      title: input.title.trim(),
      conversation_type: input.conversation_type ?? "general",
      created_by: authData.user.id,
    })
    .select("*")
    .single<Conversation>();
}
