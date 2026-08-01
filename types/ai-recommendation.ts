import type { EntityId, IsoDateTime } from "./common";

export interface AiRecommendation {
  id: EntityId;
  project_id: EntityId;
  summary: string;
  service_names: string[];
  equipment_categories: string[];
  suggested_company_ids: EntityId[];
  created_at: IsoDateTime;
}
