import type { EntityId, IsoDateTime } from "./common";

export type RequestUrgency = "normal" | "urgent" | "scheduled";

export type RequestStatus =
  | "draft"
  | "analyzing"
  | "published"
  | "matching"
  | "offers_received"
  | "accepted"
  | "cancelled"
  | "expired";

export interface Request {
  id: EntityId;
  customer_id: EntityId;
  title: string;
  description: string;
  city: string;
  location_text: string | null;
  urgency: RequestUrgency;
  desired_start_at: IsoDateTime | null;
  status: RequestStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface RequestCreateInput {
  title: string;
  description: string;
  city: string;
  location_text?: string | null;
  urgency: RequestUrgency;
  desired_start_at?: IsoDateTime | null;
}
