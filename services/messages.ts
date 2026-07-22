import {
  databaseFailure,
  serviceFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type { ProjectMessage } from "@/types/message";
import type { ServiceResult } from "@/types/service-result";

export interface SendConversationMessageInput {
  conversation_id: string;
  body: string;
}

export async function listConversationMessages(
  conversationId: string,
): Promise<ServiceResult<ProjectMessage[]>> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .neq("status", "deleted")
    .order("created_at", { ascending: true })
    .returns<ProjectMessage[]>();

  if (error) {
    return databaseFailure(error, "Не удалось получить сообщения.");
  }

  return serviceSuccess(data ?? []);
}

export async function sendConversationMessage(
  input: SendConversationMessageInput,
): Promise<ServiceResult<ProjectMessage>> {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    return databaseFailure(authError, "Не удалось проверить пользователя.");
  }

  if (!authData.user) {
    return serviceFailure("AUTH_REQUIRED", "Пользователь не авторизован.");
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversation_id,
      author_id: authData.user.id,
      body: input.body.trim(),
    })
    .select("*")
    .single<ProjectMessage>();

  if (error) {
    return databaseFailure(error, "Не удалось отправить сообщение.");
  }

  return serviceSuccess(data);
}
