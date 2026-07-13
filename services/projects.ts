import { supabase } from "@/services/supabase";
import type { Project, ProjectWorkspace } from "@/types/project";

const PROJECT_WORKSPACE_SELECT = `
  *,
  request:requests(id, title, description, city, status),
  accepted_offer:offers(id, price, currency, proposed_days, message, status),
  company:companies(id, name, city, phone, email)
`;

export async function getProject(id: string) {
  return await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single<Project>();
}

export async function getProjectWorkspace(id: string) {
  return await supabase
    .from("projects")
    .select(PROJECT_WORKSPACE_SELECT)
    .eq("id", id)
    .single<ProjectWorkspace>();
}

export async function createProject(
  project: Omit<Project, "id" | "created_at" | "updated_at">,
) {
  return await supabase
    .from("projects")
    .insert(project)
    .select()
    .single<Project>();
}

export async function getProjects(companyId: string) {
  return await supabase
    .from("projects")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .returns<Project[]>();
}

export async function updateProject(
  id: string,
  updates: Partial<Project>,
) {
  return await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single<Project>();
}

export async function deleteProject(id: string) {
  return await supabase
    .from("projects")
    .delete()
    .eq("id", id);
}
