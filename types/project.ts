import type { EntityId, IsoDateTime } from "./common";

export type ProjectStatus =
  | "draft"
  | "published"
  | "active"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "archived";

export interface Project {
  id: EntityId;
  request_id: EntityId | null;
  accepted_offer_id: EntityId | null;
  company_id: EntityId;
  owner_id: EntityId;
  title: string;
  description: string | null;
  status: ProjectStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type ProjectCreateInput = Pick<Project, "title"> &
  Partial<Pick<Project, "description" | "company_id">>;
