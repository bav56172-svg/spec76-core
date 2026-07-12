import type { EntityId, IsoDateTime } from "./common";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Payment {
  id: EntityId;
  project_id: EntityId;
  payer_id: EntityId;
  amount: number;
  currency: "RUB";
  status: PaymentStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
