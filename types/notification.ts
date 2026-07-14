import type { EntityId, IsoDateTime } from "./common";

export type NotificationChannel = "in_app";
export type NotificationStatus = "unread" | "read" | "archived";

export interface Notification {
  id: EntityId;
  user_id: EntityId;
  project_id: EntityId | null;
  activity_id: EntityId | null;
  event_type: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  message: string | null;
  read_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface NotificationSummary {
  total: number;
  unread: number;
}
