import type { SupabaseClient } from "@supabase/supabase-js";
import {
  databaseFailure,
  serviceFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import type { ServiceResult } from "@/types/service-result";

export type PlatformRole =
  | "user"
  | "moderator"
  | "administrator"
  | "platform_owner";

/**
 * Calls the has_platform_role() RLS helper (OP-032) to check whether the
 * currently authenticated user holds one of the allowed platform-level
 * roles. This is separate from company_members.role, which RLS already
 * enforces on company-scoped tables directly.
 */
export async function requirePlatformRole(
  supabase: SupabaseClient,
  allowedRoles: PlatformRole[],
): Promise<ServiceResult<true>> {
  const { data, error } = await supabase.rpc("has_platform_role", {
    allowed_roles: allowedRoles,
  });

  if (error) {
    return databaseFailure(
      error,
      "Не удалось проверить права доступа.",
    );
  }

  if (!data) {
    return serviceFailure(
      "FORBIDDEN",
      "Недостаточно прав для выполнения этого действия.",
    );
  }

  return serviceSuccess(true);
}
