import type { EntityId, IsoDateTime } from "./common";

export type CompanyStatus = "draft" | "active" | "suspended" | "archived";

export interface Company {
  id: EntityId;
  owner_id: EntityId;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  status: CompanyStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type CompanyCreateInput = Pick<Company, "name"> &
  Partial<Pick<Company, "description" | "phone" | "email" | "city">>;
