import type { EntityId, IsoDateTime } from "./common";

export type ProjectActivityType =
  | "project_created"
  | "project_status_changed"
  | "task_created"
  | "task_status_changed";

export interface ProjectActivity {
  id: EntityId;
  project_id: EntityId;
  actor_id: EntityId | null;
  event_type: ProjectActivityType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  source_key: string | null;
  created_at: IsoDateTime;
}
