import type { EntityId, IsoDateTime } from "./common";

export type ProjectStatus =
  | "draft"
  | "published"
  | "active"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "archived";

export interface ProjectRequestSummary {
  id: EntityId;
  title: string;
  description: string;
  city: string;
  status: string;
}

export interface ProjectOfferSummary {
  id: EntityId;
  price: number;
  currency: "RUB";
  proposed_days: number | null;
  message: string | null;
  status: string;
}

export interface ProjectCompanySummary {
  id: EntityId;
  name: string;
  city: string | null;
  phone: string | null;
  email: string | null;
}

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

export interface ProjectWorkspace extends Project {
  request?: ProjectRequestSummary | null;
  accepted_offer?: ProjectOfferSummary | null;
  company?: ProjectCompanySummary | null;
}

export type ProjectCreateInput = Pick<Project, "title"> &
  Partial<Pick<Project, "description" | "company_id">>;
