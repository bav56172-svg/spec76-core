import {
  databaseFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type { ProjectActivity } from "@/types/project-activity";
import type { ServiceResult } from "@/types/service-result";

export async function getProjectActivities(
  projectId: string,
): Promise<ServiceResult<ProjectActivity[]>> {
  const { data, error } = await supabase
    .from("project_activities")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<ProjectActivity[]>();

  if (error) {
    return databaseFailure(
      error,
      "Не удалось получить события проекта.",
    );
  }

  return serviceSuccess(data ?? []);
}
