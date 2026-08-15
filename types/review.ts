import type { EntityId, IsoDateTime } from "./common";

export interface Review {
  id: EntityId;
  project_id: EntityId;
  author_id: EntityId;
  company_id: EntityId;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  created_at: IsoDateTime;
}
