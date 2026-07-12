import type { EntityId, IsoDateTime } from "./common";

export interface Equipment {
  id: EntityId;
  company_id: EntityId;
  name: string;
  category: string;
  description: string | null;
  is_available: boolean;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
