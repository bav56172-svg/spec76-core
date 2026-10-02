import type { EntityId, IsoDateTime } from "./common";

export interface UserProfile {
  id: EntityId;
  display_name: string | null;
  avatar_url: string | null;
  locale: string | null;
  timezone: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
