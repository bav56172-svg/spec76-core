import type { EntityId, IsoDateTime } from "./common";

export type ConversationType =
  | "general"
  | "task"
  | "document"
  | "timeline"
  | "milestone";

export type ConversationStatus = "active" | "archived";
export type ConversationParticipantRole = "owner" | "member" | "observer";

export interface Conversation {
  id: EntityId;
  project_id: EntityId;
  title: string;
  conversation_type: ConversationType;
  status: ConversationStatus;
  created_by: EntityId;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface ConversationParticipant {
  conversation_id: EntityId;
  user_id: EntityId;
  role: ConversationParticipantRole;
  joined_at: IsoDateTime;
}
