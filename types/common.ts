export type EntityId = string;
export type IsoDateTime = string;

export type RecordStatus =
  | "draft"
  | "active"
  | "completed"
  | "cancelled"
  | "archived";

export interface TimestampedEntity {
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
