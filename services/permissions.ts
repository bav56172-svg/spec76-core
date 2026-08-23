import type { SupabaseClient } from "@supabase/supabase-js";
import {
  databaseFailure,
  serviceFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type { PlatformRole, PlatformRoleRecord } from "@/types/platform-role";
import type { ServiceResult } from "@/types/service-result";

export type { PlatformRole };

/**
 * Calls the has_platform_role() RLS helper (OP-032) to check whether the
 * currently authenticated user holds one of the allowed platform-level
 * roles. This is separate from company_members.role, which RLS already
 * enforces on company-scoped tables directly.
 */
export async function requirePlatformRole(
  supabaseClient: SupabaseClient,
  allowedRoles: PlatformRole[],
): Promise<ServiceResult<true>> {
  const { data, error } = await supabaseClient.rpc("has_platform_role", {
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

// OP-024: Platform Owner Control Center.

/**
 * Returns the current user's own platform role, defaulting to "user"
 * when no platform_roles row exists yet (matches the column default).
 * Used client-side to decide whether to show the admin UI at all.
 */
export async function getMyPlatformRole(): Promise<
  ServiceResult<PlatformRole>
> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return databaseFailure(authError, "Не удалось проверить пользователя.");
  }

  if (!user) {
    return serviceFailure("AUTH_REQUIRED", "Необходимо войти в систему.");
  }

  const { data, error } = await supabase
    .from("platform_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle<Pick<PlatformRoleRecord, "role">>();

  if (error) {
    return databaseFailure(error, "Не удалось получить роль пользователя.");
  }

  return serviceSuccess(data?.role ?? "user");
}

/**
 * Lists everyone who has an explicit platform role assigned. Readable
 * only by moderator/administrator/platform_owner per RLS
 * (platform_roles_select_administrators, OP-032).
 */
export async function listPlatformRoles(): Promise<
  ServiceResult<PlatformRoleRecord[]>
> {
  const { data, error } = await supabase
    .from("platform_roles")
    .select("*")
    .order("created_at", { ascending: true })
    .returns<PlatformRoleRecord[]>();

  if (error) {
    return databaseFailure(error, "Не удалось получить список ролей.");
  }

  return serviceSuccess(data ?? []);
}

/**
 * Assigns or changes a user's platform role. Authorization is enforced
 * entirely by RLS (OP-024 migration): only platform_owner may assign
 * platform_owner/administrator, only administrator may assign moderator.
 * A rejected write surfaces as DATABASE_ERROR below.
 */
export async function setPlatformRole(
  userId: string,
  role: PlatformRole,
): Promise<ServiceResult<PlatformRoleRecord>> {
  const { data, error } = await supabase
    .from("platform_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id" })
    .select("*")
    .single<PlatformRoleRecord>();

  if (error) {
    return databaseFailure(error, "Не удалось назначить роль.");
  }

  return serviceSuccess(data);
}
