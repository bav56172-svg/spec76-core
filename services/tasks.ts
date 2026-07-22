import {
  databaseFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type { ServiceResult } from "@/types/service-result";
import type { Task, TaskCreateInput, TaskStatus } from "@/types/task";

type TaskUpdateInput = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "priority"
    | "due_at"
    | "assignee_id"
    | "position"
  >
>;

export async function getTasks(
  projectId: string,
): Promise<ServiceResult<Task[]>> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<Task[]>();

  if (error) {
    return databaseFailure(error, "Не удалось получить задачи.");
  }

  return serviceSuccess(data ?? []);
}

export async function createTask(
  input: TaskCreateInput,
): Promise<ServiceResult<Task>> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: input.project_id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      priority: input.priority ?? "normal",
      due_at: input.due_at ?? null,
      assignee_id: input.assignee_id ?? null,
      position: input.position ?? 0,
      status: "todo",
    })
    .select("*")
    .single<Task>();

  if (error) {
    return databaseFailure(error, "Не удалось создать задачу.");
  }

  return serviceSuccess(data);
}

export async function updateTask(
  id: string,
  updates: TaskUpdateInput,
): Promise<ServiceResult<Task>> {
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single<Task>();

  if (error) {
    return databaseFailure(error, "Не удалось обновить задачу.");
  }

  return serviceSuccess(data);
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<ServiceResult<Task>> {
  const { data, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single<Task>();

  if (error) {
    return databaseFailure(
      error,
      "Не удалось обновить статус задачи.",
    );
  }

  return serviceSuccess(data);
}

export async function deleteTask(
  id: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    return databaseFailure(error, "Не удалось удалить задачу.");
  }

  return serviceSuccess(null);
}
