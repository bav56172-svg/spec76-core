import {
  databaseFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type { ServiceResult } from "@/types/service-result";
import type {
  ProjectMilestone,
  ProjectTimeline,
  TimelineStatus,
} from "@/types/timeline";

export interface CreateTimelineInput {
  project_id: string;
  title: string;
  description?: string;
  planned_start?: string;
  planned_finish?: string;
}

export interface UpdateTimelineInput {
  title?: string;
  description?: string | null;
  planned_start?: string | null;
  planned_finish?: string | null;
  actual_start?: string | null;
  actual_finish?: string | null;
  status?: TimelineStatus;
  progress?: number;
}

export interface CreateMilestoneInput {
  project_id: string;
  timeline_id?: string | null;
  title: string;
  description?: string;
  due_date?: string;
}

export async function listProjectTimelines(
  projectId: string,
): Promise<ServiceResult<ProjectTimeline[]>> {
  const { data, error } = await supabase
    .from("project_timelines")
    .select("*")
    .eq("project_id", projectId)
    .order("planned_start", { ascending: true })
    .returns<ProjectTimeline[]>();

  if (error) {
    return databaseFailure(
      error,
      "Не удалось получить календарный план проекта.",
    );
  }

  return serviceSuccess(data ?? []);
}

export async function listProjectMilestones(
  projectId: string,
): Promise<ServiceResult<ProjectMilestone[]>> {
  const { data, error } = await supabase
    .from("project_milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("due_date", { ascending: true })
    .returns<ProjectMilestone[]>();

  if (error) {
    return databaseFailure(
      error,
      "Не удалось получить контрольные точки проекта.",
    );
  }

  return serviceSuccess(data ?? []);
}

export async function createTimeline(
  input: CreateTimelineInput,
): Promise<ServiceResult<ProjectTimeline>> {
  const { data, error } = await supabase
    .from("project_timelines")
    .insert({
      ...input,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: "planned",
      progress: 0,
    })
    .select("*")
    .single<ProjectTimeline>();

  if (error) {
    return databaseFailure(
      error,
      "Не удалось создать календарный план.",
    );
  }

  return serviceSuccess(data);
}

export async function updateTimeline(
  id: string,
  updates: UpdateTimelineInput,
): Promise<ServiceResult<ProjectTimeline>> {
  const { data, error } = await supabase
    .from("project_timelines")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single<ProjectTimeline>();

  if (error) {
    return databaseFailure(
      error,
      "Не удалось обновить календарный план.",
    );
  }

  return serviceSuccess(data);
}

export async function createMilestone(
  input: CreateMilestoneInput,
): Promise<ServiceResult<ProjectMilestone>> {
  const { data, error } = await supabase
    .from("project_milestones")
    .insert({
      ...input,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: "planned",
    })
    .select("*")
    .single<ProjectMilestone>();

  if (error) {
    return databaseFailure(
      error,
      "Не удалось создать контрольную точку.",
    );
  }

  return serviceSuccess(data);
}

export async function completeMilestone(
  id: string,
): Promise<ServiceResult<ProjectMilestone>> {
  const { data, error } = await supabase
    .from("project_milestones")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single<ProjectMilestone>();

  if (error) {
    return databaseFailure(
      error,
      "Не удалось завершить контрольную точку.",
    );
  }

  return serviceSuccess(data);
}
