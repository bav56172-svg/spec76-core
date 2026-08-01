import type { EntityId, IsoDateTime } from "./common";

export interface ContractorMatch {
  id: EntityId;
  request_id: EntityId;
  company_id: EntityId;
  score: number;
  matched_services: string[];
  matched_equipment: string[];
  reasons: string[];
  is_current: boolean;
  created_at: IsoDateTime;
  company?: {
    id: EntityId;
    name: string;
    city: string | null;
  };
}

export interface ContractorMatchDraft {
  company_id: EntityId;
  score: number;
  matched_services: string[];
  matched_equipment: string[];
  reasons: string[];
}
