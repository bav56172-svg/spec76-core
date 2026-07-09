import { supabase } from "@/services/supabase";
import { Task } from "@/types/task";

/**
 * Получить все задачи проекта
 */
export async function getTasks(projectId: string) {
  return await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
}

/**
 * Создать задачу
 */
export async function createTask(
  task: Omit<Task, "id" | "created_at" | "updated_at">
) {
  return await supabase
    .from("tasks")
    .insert(task)
    .select()
    .single();
}

/**
 * Обновить задачу
 */
export async function updateTask(
  id: string,
  updates: Partial<Task>
) {
  return await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
}

/**
 * Удалить задачу
 */
export async function deleteTask(id: string) {
  return await supabase
    .from("tasks")
    .delete()
    .eq("id", id);
}

/**
 * Изменить статус задачи
 */
export async function updateTaskStatus(
  id: string,
  status: "todo" | "in_progress" | "done"
) {
  return await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
}