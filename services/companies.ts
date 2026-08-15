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
import type {
  CompanyMember,
  CompanyMemberInviteInput,
} from "@/types/company-member";
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

  const slug = createCompanySlug(name);

  const { error: insertError } = await supabase
    .from("companies")
    .insert({
      owner_id: user.id,
      name,
      slug,
    });

  if (insertError) {
    return databaseFailure(
      insertError,
      "Не удалось создать компанию.",
    );
  }

  const { data, error: selectError } = await supabase
    .from("companies")
    .select("*")
    .eq("slug", slug)
    .single<Company>();

  if (selectError) {
    return databaseFailure(
      selectError,
      "Компания создана, но не удалось получить её данные.",
    );
  }

  return serviceSuccess(data);
}

// OP-033: Organization Membership (Wave 1 — Identity & Access).
//
// Invitation by user_id only: the invited person must already have an
// account. Email invitations for people without an account are a
// separate flow (invitation token + signup) and are intentionally out
// of scope here — they introduce a new entity (a pending invitation
// with expiry) and were not approved as part of this change.

export async function listCompanyMembers(
  companyId: string,
): Promise<ServiceResult<CompanyMember[]>> {
  const { data, error } = await supabase
    .from("company_members")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true })
    .returns<CompanyMember[]>();

  if (error) {
    return databaseFailure(error, "Не удалось получить участников компании.");
  }

  return serviceSuccess(data ?? []);
}

export async function inviteCompanyMember(
  input: CompanyMemberInviteInput,
): Promise<ServiceResult<CompanyMember>> {
  // Authorization is enforced by the company_members_insert_management
  // RLS policy (EP-024): only an existing owner/admin of company_id may
  // insert a new row here. A rejected insert surfaces as a DATABASE_ERROR
  // below rather than a separate permission check in this function.
  const { data, error } = await supabase
    .from("company_members")
    .insert({
      company_id: input.company_id,
      user_id: input.user_id,
      role: input.role ?? "member",
    })
    .select("*")
    .single<CompanyMember>();

  if (error) {
    return databaseFailure(error, "Не удалось пригласить участника.");
  }

  return serviceSuccess(data);
}

export async function removeCompanyMember(
  companyId: string,
  userId: string,
): Promise<ServiceResult<true>> {
  // Authorization enforced by company_members_delete_management_or_self
  // RLS policy: an owner/admin may remove anyone; a member may remove
  // only themselves (leave the company).
  const { error } = await supabase
    .from("company_members")
    .delete()
    .eq("company_id", companyId)
    .eq("user_id", userId);

  if (error) {
    return databaseFailure(error, "Не удалось удалить участника.");
  }

  return serviceSuccess(true);
}
