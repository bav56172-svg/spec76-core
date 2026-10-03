import { databaseFailure, serviceSuccess } from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import { requirePlatformRole } from "@/services/permissions";
import type { AuditLogEntry } from "@/types/audit-log";
import type { ServiceResult } from "@/types/service-result";

// OP-026: Audit Foundation (Wave 3, Release 0.4). See ADR-027.

/**
 * Lists recent audit_log entries, optionally filtered by entity_type
 * (e.g. "platform_roles"). RLS already restricts reads to
 * administrator/platform_owner (audit_log_select_platform_owner_administrators),
 * but requirePlatformRole() is checked first so a non-privileged caller
 * gets a clear FORBIDDEN instead of a confusing empty list.
 */
export async function listAuditLog(
  entityType?: string,
  limit = 50,
): Promise<ServiceResult<AuditLogEntry[]>> {
  const access = await requirePlatformRole(supabase, [
    "administrator",
    "platform_owner",
  ]);

  if (access.error) {
    return access;
  }

  let query = supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (entityType) {
    query = query.eq("entity_type", entityType);
  }

  const { data, error } = await query.returns<AuditLogEntry[]>();

  if (error) {
    return databaseFailure(error, "Не удалось получить журнал действий.");
  }

  return serviceSuccess(data ?? []);
}
