import type { EntityId, IsoDateTime } from "./common";

export type TaskStatus = "todo" | "in_progress" | "review" | "done" | "cancelled";

export interface Task {
  id: EntityId;
  project_id: EntityId;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
