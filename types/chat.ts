import type { EntityId, IsoDateTime } from "./common";

export interface ChatMessage {
  id: EntityId;
  project_id: EntityId;
  sender_id: EntityId;
  body: string;
  created_at: IsoDateTime;
}
