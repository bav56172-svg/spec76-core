import type { EntityId, IsoDateTime } from "./common";

export type MessageStatus = "active" | "edited" | "deleted";
export type MessageAttachmentKind = "document" | "task" | "timeline" | "milestone";

export interface ProjectMessage {
  id: EntityId;
  conversation_id: EntityId;
  author_id: EntityId;
  body: string;
  status: MessageStatus;
  edited_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface MessageAttachment {
  id: EntityId;
  message_id: EntityId;
  attachment_kind: MessageAttachmentKind;
  linked_entity_id: EntityId;
  created_at: IsoDateTime;
}
