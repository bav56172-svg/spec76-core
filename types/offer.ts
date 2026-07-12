import type { EntityId, IsoDateTime } from "./common";

export type OfferStatus = "submitted" | "accepted" | "rejected" | "withdrawn";

export interface Offer {
  id: EntityId;
  project_id: EntityId;
  company_id: EntityId;
  price: number | null;
  message: string | null;
  status: OfferStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
