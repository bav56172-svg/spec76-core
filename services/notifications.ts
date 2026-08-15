import {
  databaseFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type { Notification } from "@/types/notification";
import type { ServiceResult } from "@/types/service-result";

export async function listProjectNotifications(
  projectId: string,
): Promise<ServiceResult<Notification[]>> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<Notification[]>();

  if (error) {
    return databaseFailure(error, "Не удалось получить уведомления.");
  }

  return serviceSuccess(data ?? []);
}

export async function markNotificationAsRead(
  id: string,
): Promise<ServiceResult<Notification>> {
  const { data, error } = await supabase
    .from("notifications")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single<Notification>();

  if (error) {
    return databaseFailure(
      error,
      "Не удалось отметить уведомление прочитанным.",
    );
  }

  return serviceSuccess(data);
}

export async function markAllProjectNotificationsAsRead(
  projectId: string,
): Promise<ServiceResult<Notification[]>> {
  const { data, error } = await supabase
    .from("notifications")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("status", "unread")
    .select("*")
    .returns<Notification[]>();

  if (error) {
    return databaseFailure(
      error,
      "Не удалось отметить уведомления прочитанными.",
    );
  }

  return serviceSuccess(data ?? []);
}
