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

function createCompanySlug(name: string): string {
  const normalizedName = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  const prefix = normalizedName || "company";
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12);

  return `${prefix}-${suffix}`;
}

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

  const name = input.name.trim();

  if (!name) {
    return serviceFailure(
      "VALIDATION_ERROR",
      "Введите название компании.",
    );
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({
      owner_id: user.id,
      name,
      slug: createCompanySlug(name),
    })
    .select("*")
    .single<Company>();

  if (error) {
    return databaseFailure(error, "Не удалось создать компанию.");
  }

  return serviceSuccess(data);
}
