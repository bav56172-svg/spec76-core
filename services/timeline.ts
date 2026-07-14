import { supabase } from "@/services/supabase";
import type {
  ProjectMilestone,
  ProjectTimeline,
  TimelineStatus,
} from "@/types/timeline";

export async function listProjectTimelines(projectId: string) {
  return await supabase
    .from("project_timelines")
    .select("*")
    .eq("project_id", projectId)
    .order("planned_start", { ascending: true })
    .returns<ProjectTimeline[]>();
}

export async function listProjectMilestones(projectId: string) {
  return await supabase
    .from("project_milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("due_date", { ascending: true })
    .returns<ProjectMilestone[]>();
}

export async function createTimeline(input: {
  project_id: string;
  title: string;
  description?: string;
  planned_start?: string;
  planned_finish?: string;
}) {
  return await supabase
    .from("project_timelines")
    .insert({ ...input, status: "planned", progress: 0 })
    .select("*")
    .single<ProjectTimeline>();
}

export async function updateTimeline(
  id: string,
  updates: Partial<{
    title: string;
    description: string | null;
    planned_start: string | null;
    planned_finish: string | null;
    actual_start: string | null;
    actual_finish: string | null;
    status: TimelineStatus;
    progress: number;
  }>,
) {
  return await supabase
    .from("project_timelines")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single<ProjectTimeline>();
}

export async function createMilestone(input: {
  project_id: string;
  timeline_id?: string | null;
  title: string;
  description?: string;
  due_date?: string;
}) {
  return await supabase
    .from("project_milestones")
    .insert({ ...input, status: "planned" })
    .select("*")
    .single<ProjectMilestone>();
}

export async function completeMilestone(id: string) {
  return await supabase
    .from("project_milestones")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single<ProjectMilestone>();
}
