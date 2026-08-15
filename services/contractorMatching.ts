import {
  databaseFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type {
  ContractorMatch,
  ContractorMatchDraft,
} from "@/types/contractor-match";
import type { Request } from "@/types/request";
import type { RequestAnalysis } from "@/types/request-analysis";
import type { ServiceResult } from "@/types/service-result";

interface CompanyCandidate {
  id: string;
  name: string;
  city: string | null;
  status: string | null;
}

interface CompanyCapability {
  company_id: string;
  value: string;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("ru-RU");
}

function intersections(source: string[], target: string[]): string[] {
  const targetSet = new Set(target.map(normalize));
  return source.filter((item) => targetSet.has(normalize(item)));
}

function buildDraft(
  request: Request,
  analysis: RequestAnalysis,
  company: CompanyCandidate,
  serviceValues: string[],
  equipmentValues: string[],
): ContractorMatchDraft | null {
  const matchedServices = intersections(analysis.services, serviceValues);
  const matchedEquipment = intersections(
    analysis.equipment,
    equipmentValues,
  );
  const cityMatches =
    Boolean(company.city) &&
    normalize(company.city ?? "") === normalize(request.city);

  let score = 0;
  const reasons: string[] = [];

  if (analysis.services.length > 0 && matchedServices.length > 0) {
    score += Math.round(
      (matchedServices.length / analysis.services.length) * 50,
    );
    reasons.push(`Совпали услуги: ${matchedServices.join(", ")}`);
  }

  if (analysis.equipment.length > 0 && matchedEquipment.length > 0) {
    score += Math.round(
      (matchedEquipment.length / analysis.equipment.length) * 30,
    );
    reasons.push(`Есть техника: ${matchedEquipment.join(", ")}`);
  }

  if (cityMatches) {
    score += 20;
    reasons.push(`Работает в городе ${request.city}`);
  }

  if (score === 0) {
    return null;
  }

  return {
    company_id: company.id,
    score: Math.min(score, 100),
    matched_services: matchedServices,
    matched_equipment: matchedEquipment,
    reasons,
  };
}

export async function getCurrentContractorMatches(
  requestId: string,
): Promise<ServiceResult<ContractorMatch[]>> {
  const { data, error } = await supabase
    .from("request_matches")
    .select("*, company:companies(id, name, city)")
    .eq("request_id", requestId)
    .eq("is_current", true)
    .order("score", { ascending: false })
    .returns<ContractorMatch[]>();

  if (error) {
    return databaseFailure(
      error,
      "Не удалось получить подбор исполнителей.",
    );
  }

  return serviceSuccess(data ?? []);
}

export async function runContractorMatching(
  request: Request,
  analysis: RequestAnalysis,
): Promise<ServiceResult<ContractorMatch[]>> {
  const companiesResult = await supabase
    .from("companies")
    .select("id, name, city, status")
    .in("status", ["active", "draft"])
    .returns<CompanyCandidate[]>();

  if (companiesResult.error) {
    return databaseFailure(
      companiesResult.error,
      "Не удалось получить компании.",
    );
  }

  const companies = companiesResult.data ?? [];
  const companyIds = companies.map((company) => company.id);

  if (companyIds.length === 0) {
    return serviceSuccess([]);
  }

  const [servicesResult, equipmentResult] = await Promise.all([
    supabase
      .from("company_services")
      .select("company_id, value:service_name")
      .in("company_id", companyIds)
      .returns<CompanyCapability[]>(),
    supabase
      .from("company_equipment")
      .select("company_id, value:equipment_name")
      .in("company_id", companyIds)
      .returns<CompanyCapability[]>(),
  ]);

  if (servicesResult.error) {
    return databaseFailure(
      servicesResult.error,
      "Не удалось получить услуги компаний.",
    );
  }

  if (equipmentResult.error) {
    return databaseFailure(
      equipmentResult.error,
      "Не удалось получить технику компаний.",
    );
  }

  const drafts = companies
    .map((company) => {
      const serviceValues = (servicesResult.data ?? [])
        .filter((item) => item.company_id === company.id)
        .map((item) => item.value);
      const equipmentValues = (equipmentResult.data ?? [])
        .filter((item) => item.company_id === company.id)
        .map((item) => item.value);

      return buildDraft(
        request,
        analysis,
        company,
        serviceValues,
        equipmentValues,
      );
    })
    .filter((item): item is ContractorMatchDraft => item !== null)
    .sort((left, right) => right.score - left.score);

  const deactivateResult = await supabase
    .from("request_matches")
    .update({ is_current: false })
    .eq("request_id", request.id)
    .eq("is_current", true);

  if (deactivateResult.error) {
    return databaseFailure(
      deactivateResult.error,
      "Не удалось обновить предыдущий подбор.",
    );
  }

  if (drafts.length === 0) {
    return serviceSuccess([]);
  }

  const insertResult = await supabase
    .from("request_matches")
    .insert(
      drafts.map((draft) => ({
        request_id: request.id,
        ...draft,
        is_current: true,
      })),
    )
    .select("*, company:companies(id, name, city)")
    .order("score", { ascending: false })
    .returns<ContractorMatch[]>();

  if (insertResult.error) {
    return databaseFailure(
      insertResult.error,
      "Не удалось сохранить подбор исполнителей.",
    );
  }

  return serviceSuccess(insertResult.data ?? []);
}

// OP-023: Contractor Journey — "Доступные заказы".
//
// Reads requests from the contractor company's side: only requests where
// this company has a current match (request_matches.is_current = true)
// are visible, per the RLS policies added alongside this change. This is
// intentionally not a raw browse of all open requests — matching stays
// algorithm-driven (request_analyses / runContractorMatching), and the
// company only sees what it was actually matched to.
export async function listAvailableRequestsForCompany(
  companyId: string,
): Promise<ServiceResult<(ContractorMatch & { request: Request })[]>> {
  const { data, error } = await supabase
    .from("request_matches")
    .select("*, request:requests(*)")
    .eq("company_id", companyId)
    .eq("is_current", true)
    .order("score", { ascending: false })
    .returns<(ContractorMatch & { request: Request })[]>();

  if (error) {
    return databaseFailure(error, "Не удалось получить доступные заказы.");
  }

  return serviceSuccess(data ?? []);
}
