import type { EntityId, IsoDateTime } from "./common";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "review"
  | "done"
  | "cancelled";

export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface Task {
  id: EntityId;
  project_id: EntityId;
  assignee_id: EntityId | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: IsoDateTime | null;
  position: number;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface TaskCreateInput {
  project_id: EntityId;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  due_at?: IsoDateTime | null;
  assignee_id?: EntityId | null;
  position?: number;
}
