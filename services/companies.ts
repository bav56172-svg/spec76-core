import {
  databaseFailure,
  serviceFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type {
  Company,
  CompanyCreateInput,
} from "@/types/company";
import type { ServiceResult } from "@/types/service-result";

export async function listCompanies(): Promise<ServiceResult<Company[]>> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Company[]>();

  if (error) {
    return databaseFailure(error, "Не удалось получить компании.");
  }

  return serviceSuccess(data ?? []);
}

export async function getCurrentUserCompany(): Promise<
  ServiceResult<Company | null>
> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return databaseFailure(
      authError,
      "Не удалось проверить пользователя.",
    );
  }

  if (!user) {
    return serviceFailure(
      "AUTH_REQUIRED",
      "Необходимо войти в систему.",
    );
  }

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle<Company>();

  if (error) {
    return databaseFailure(
      error,
      "Не удалось получить компанию пользователя.",
    );
  }

  return serviceSuccess(data);
}

export async function createCompany(
  input: CompanyCreateInput,
): Promise<ServiceResult<Company>> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return databaseFailure(
      authError,
      "Не удалось проверить пользователя.",
    );
  }

  if (!user) {
    return serviceFailure(
      "AUTH_REQUIRED",
      "Необходимо войти в систему.",
    );
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({
      owner_id: user.id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      city: input.city?.trim() || null,
    })
    .select("*")
    .single<Company>();

  if (error) {
    return databaseFailure(error, "Не удалось создать компанию.");
  }

  return serviceSuccess(data);
}
