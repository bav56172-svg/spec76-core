import type { EntityId, IsoDateTime } from "./common";

export interface AuditLogEntry {
  id: EntityId;
  actor_id: EntityId | null;
  entity_type: string;
  entity_id: EntityId;
  action: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: IsoDateTime;
}
