import { supabase } from "@/services/supabase";
import { Project } from "@/types/project";

export async function getProject(id: string) {
  return await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
}

export async function createProject(
  project: Omit<Project, "id" | "created_at" | "updated_at">
) {
  return await supabase
    .from("projects")
    .insert(project)
    .select()
    .single();
}

export async function getProjects(companyId: string) {
  return await supabase
    .from("projects")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
) {
  return await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
}

export async function deleteProject(id: string) {
  return await supabase
    .from("projects")
    .delete()
    .eq("id", id);
}