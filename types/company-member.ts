import type { EntityId, IsoDateTime } from "./common";

export type CompanyMemberRole = "owner" | "admin" | "member";

export interface CompanyMember {
  company_id: EntityId;
  user_id: EntityId;
  role: CompanyMemberRole;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type CompanyMemberInviteInput = Pick<
  CompanyMember,
  "company_id" | "user_id"
> & {
  role?: CompanyMemberRole;
};
