import {
  databaseFailure,
  serviceFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type { Conversation, ConversationType } from "@/types/conversation";
import type { ServiceResult } from "@/types/service-result";

export interface CreateProjectConversationInput {
  project_id: string;
  title: string;
  conversation_type?: ConversationType;
}

export async function listProjectConversations(
  projectId: string,
): Promise<ServiceResult<Conversation[]>> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .returns<Conversation[]>();

  if (error) {
    return databaseFailure(error, "Не удалось получить обсуждения проекта.");
  }

  return serviceSuccess(data ?? []);
}

export async function createProjectConversation(
  input: CreateProjectConversationInput,
): Promise<ServiceResult<Conversation>> {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    return databaseFailure(authError, "Не удалось проверить пользователя.");
  }

  if (!authData.user) {
    return serviceFailure("AUTH_REQUIRED", "Пользователь не авторизован.");
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      project_id: input.project_id,
      title: input.title.trim(),
      conversation_type: input.conversation_type ?? "general",
      created_by: authData.user.id,
    })
    .select("*")
    .single<Conversation>();

  if (error) {
    return databaseFailure(error, "Не удалось создать обсуждение.");
  }

  return serviceSuccess(data);
}
