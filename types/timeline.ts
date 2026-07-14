import type { EntityId, IsoDateTime } from "./common";

export type TimelineStatus = "planned" | "active" | "completed" | "cancelled";
export type MilestoneStatus = "planned" | "completed" | "cancelled";

export interface ProjectTimeline {
  id: EntityId;
  project_id: EntityId;
  title: string;
  description: string | null;
  planned_start: string | null;
  planned_finish: string | null;
  actual_start: string | null;
  actual_finish: string | null;
  status: TimelineStatus;
  progress: number;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface ProjectMilestone {
  id: EntityId;
  project_id: EntityId;
  timeline_id: EntityId | null;
  title: string;
  description: string | null;
  due_date: string | null;
  completed_at: IsoDateTime | null;
  status: MilestoneStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
