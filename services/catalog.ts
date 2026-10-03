import { databaseFailure, serviceSuccess } from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type { Equipment } from "@/types/equipment";
import type { EquipmentCategory } from "@/types/equipment-category";
import type { ServiceResult } from "@/types/service-result";

// OP-034: Public Equipment Catalog Foundation (see ADR-028). Deliberately
// anon-safe — no requirePlatformRole()/auth check. The anon RLS policy on
// company_equipment ("published listings of active companies only",
// migration 20261003000100) is what actually restricts visibility; these
// functions filter the same way client-side only for clearer intent, not
// as the real security boundary.

export type CatalogListing = Equipment & {
  company: {
    name: string;
    city: string | null;
    phone: string | null;
    email: string | null;
  };
};

export interface CatalogFilters {
  category?: EquipmentCategory;
  city?: string;
}

export async function listPublicCatalog(
  filters: CatalogFilters = {},
): Promise<ServiceResult<CatalogListing[]>> {
  // `companies!inner(...)` (not the plain embed used elsewhere in this
  // codebase, e.g. services/offers.ts) is required here specifically so
  // that `.eq("company.city", ...)` below filters the top-level rows —
  // PostgREST only applies embedded-resource filters to the parent query
  // when the embed is an inner join.
  let query = supabase
    .from("company_equipment")
    .select("*, company:companies!inner(name, city, phone, email)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.city) {
    query = query.eq("company.city", filters.city);
  }

  const { data, error } = await query.returns<CatalogListing[]>();

  if (error) {
    return databaseFailure(error, "Не удалось загрузить каталог.");
  }

  return serviceSuccess(data ?? []);
}

export async function getPublicCatalogItem(
  equipmentId: string,
): Promise<ServiceResult<CatalogListing>> {
  const { data, error } = await supabase
    .from("company_equipment")
    .select("*, company:companies(name, city, phone, email)")
    .eq("id", equipmentId)
    .eq("status", "published")
    .single<CatalogListing>();

  if (error) {
    return databaseFailure(error, "Объявление не найдено.");
  }

  return serviceSuccess(data);
}
