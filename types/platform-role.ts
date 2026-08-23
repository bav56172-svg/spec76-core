import type { EntityId, IsoDateTime } from "./common";

export type PlatformRole =
  | "user"
  | "moderator"
  | "administrator"
  | "platform_owner";

export interface PlatformRoleRecord {
  user_id: EntityId;
  role: PlatformRole;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
