import { supabase } from "@/services/supabase";
import type { Task, TaskCreateInput, TaskStatus } from "@/types/task";

export async function getTasks(projectId: string) {
  return await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<Task[]>();
}

export async function createTask(input: TaskCreateInput) {
  return await supabase
    .from("tasks")
    .insert({
      project_id: input.project_id,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? "normal",
      due_at: input.due_at ?? null,
      assignee_id: input.assignee_id ?? null,
      position: input.position ?? 0,
      status: "todo",
    })
    .select("*")
    .single<Task>();
}

export async function updateTask(
  id: string,
  updates: Partial<Pick<Task, "title" | "description" | "priority" | "due_at" | "assignee_id" | "position">>,
) {
  return await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single<Task>();
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  return await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single<Task>();
}

export async function deleteTask(id: string) {
  return await supabase.from("tasks").delete().eq("id", id);
}
