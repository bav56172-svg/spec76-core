import type { EntityId, IsoDateTime } from "./common";

export interface Service {
  id: EntityId;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
