import { supabase } from "@/services/supabase";
import type { Notification } from "@/types/notification";

export async function listProjectNotifications(projectId: string) {
  return await supabase
    .from("notifications")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<Notification[]>();
}

export async function markNotificationAsRead(id: string) {
  return await supabase
    .from("notifications")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single<Notification>();
}

export async function markAllProjectNotificationsAsRead(projectId: string) {
  return await supabase
    .from("notifications")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("status", "unread")
    .select("*")
    .returns<Notification[]>();
}
