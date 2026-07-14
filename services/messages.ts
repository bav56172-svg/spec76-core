import { supabase } from "@/services/supabase";
import type { ProjectMessage } from "@/types/message";

export async function listConversationMessages(conversationId: string) {
  return await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .neq("status", "deleted")
    .order("created_at", { ascending: true })
    .returns<ProjectMessage[]>();
}

export async function sendConversationMessage(input: {
  conversation_id: string;
  body: string;
}) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { data: null, error: authError ?? new Error("Пользователь не авторизован.") };
  }

  return await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversation_id,
      author_id: authData.user.id,
      body: input.body.trim(),
    })
    .select("*")
    .single<ProjectMessage>();
}
