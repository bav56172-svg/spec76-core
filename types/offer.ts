import type { EntityId, IsoDateTime } from "./common";

export type OfferStatus = "submitted" | "accepted" | "rejected" | "withdrawn";

export interface OfferCompany {
  id: EntityId;
  name: string;
  city: string | null;
}

export interface Offer {
  id: EntityId;
  request_id: EntityId;
  company_id: EntityId;
  price: number;
  currency: "RUB";
  proposed_days: number | null;
  message: string | null;
  status: OfferStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  company?: OfferCompany | null;
}

export interface OfferCreateInput {
  request_id: EntityId;
  company_id: EntityId;
  price: number;
  proposed_days?: number | null;
  message?: string | null;
}
