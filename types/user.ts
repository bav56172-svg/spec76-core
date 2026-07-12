import type { EntityId, IsoDateTime } from "./common";

export type UserRole =
  | "customer"
  | "contractor"
  | "company_admin"
  | "platform_admin";

export interface UserProfile {
  id: EntityId;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
