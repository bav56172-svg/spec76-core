import {
  databaseFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type { Equipment, EquipmentCreateInput } from "@/types/equipment";
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
