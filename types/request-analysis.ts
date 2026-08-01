import type { EntityId, IsoDateTime } from "./common";

export type RequestAnalysisStatus = "completed" | "needs_clarification";

export interface RequestAnalysis {
  id: EntityId;
  request_id: EntityId;
  services: string[];
  equipment: string[];
  materials: string[];
  estimated_scope: string | null;
  confidence: number;
  clarifications: string[];
  status: RequestAnalysisStatus;
  is_current: boolean;
  created_at: IsoDateTime;
}

export interface RequestAnalysisDraft {
  services: string[];
  equipment: string[];
  materials: string[];
  estimated_scope: string | null;
  confidence: number;
  clarifications: string[];
  status: RequestAnalysisStatus;
}
