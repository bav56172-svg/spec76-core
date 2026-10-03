import {
  databaseFailure,
  serviceFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type {
  Equipment,
  EquipmentCreateInput,
  EquipmentUpdateInput,
} from "@/types/equipment";
import type { ServiceResult } from "@/types/service-result";

export async function listCompanyEquipment(
  companyId: string,
): Promise<ServiceResult<Equipment[]>> {
  const { data, error } = await supabase
    .from("company_equipment")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .returns<Equipment[]>();

  if (error) {
    return databaseFailure(error, "Не удалось получить технику компании.");
  }

  return serviceSuccess(data ?? []);
}

export async function addCompanyEquipment(
  companyId: string,
  input: EquipmentCreateInput,
): Promise<ServiceResult<Equipment>> {
  // Authorization enforced by the "Company owners manage company
  // equipment" RLS policy (companies.owner_id = auth.uid()). Same
  // owner_id-only limitation as getCurrentUserCompany() — a plain
  // company_members "member" cannot manage equipment yet either.
  const { data, error } = await supabase
    .from("company_equipment")
    .insert({
      company_id: companyId,
      equipment_name: input.equipment_name.trim(),
    })
    .select("*")
    .single<Equipment>();

  if (error) {
    return databaseFailure(error, "Не удалось добавить технику.");
  }

  return serviceSuccess(data);
}

// OP-034: Public Equipment Catalog Foundation (see ADR-028). Turns a bare
// "Моя техника" entry into a publishable catalog listing. Authorization
// is the same "Company owners manage company equipment" RLS policy as
// addCompanyEquipment()/removeCompanyEquipment() above — no new policy
// needed for this, only for the new anon SELECT path (see migration).
export async function updateCompanyEquipment(
  equipmentId: string,
  input: EquipmentUpdateInput,
): Promise<ServiceResult<Equipment>> {
  const { data, error } = await supabase
    .from("company_equipment")
    .update(input)
    .eq("id", equipmentId)
    .select("*")
    .single<Equipment>();

  if (error) {
    return databaseFailure(error, "Не удалось обновить объявление.");
  }

  return serviceSuccess(data);
}

// Uploads a cover photo to the public `equipment-photos` Storage bucket
// under {company_id}/{equipment_id}-{timestamp}.{ext}, matching the
// storage.objects RLS policies (path prefix = owning company's id), then
// stores the resulting path (not a full URL — the bucket is public, the
// UI builds the URL via supabase.storage.from().getPublicUrl() at render
// time) on the equipment row.
export async function uploadEquipmentPhoto(
  companyId: string,
  equipmentId: string,
  file: File,
): Promise<ServiceResult<Equipment>> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${companyId}/${equipmentId}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("equipment-photos")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    return serviceFailure(
      "DATABASE_ERROR",
      "Не удалось загрузить фото.",
      uploadError,
    );
  }

  return updateCompanyEquipment(equipmentId, { cover_photo_path: path });
}

export async function removeCompanyEquipment(
  equipmentId: string,
): Promise<ServiceResult<true>> {
  const { error } = await supabase
    .from("company_equipment")
    .delete()
    .eq("id", equipmentId);

  if (error) {
    return databaseFailure(error, "Не удалось удалить технику.");
  }

  return serviceSuccess(true);
}
