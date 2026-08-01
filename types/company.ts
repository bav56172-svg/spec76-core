import type { EntityId, IsoDateTime } from "./common";

export interface Company {
  id: EntityId;
  owner_id: EntityId | null;
  name: string;
  slug: string;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type CompanyCreateInput = Pick<Company, "name">;
