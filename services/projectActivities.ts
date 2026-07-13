import { supabase } from "@/services/supabase";
import type { ProjectActivity } from "@/types/project-activity";

export async function getProjectActivities(projectId: string) {
  return await supabase
    .from("project_activities")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<ProjectActivity[]>();
}
