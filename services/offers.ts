import {
  databaseFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type { Offer, OfferCreateInput } from "@/types/offer";
import type { Request } from "@/types/request";
import type { ServiceResult } from "@/types/service-result";

export async function getOffersForRequest(
  requestId: string,
): Promise<ServiceResult<Offer[]>> {
  const { data, error } = await supabase
    .from("offers")
    .select("*, company:companies(id, name, city)")
    .eq("request_id", requestId)
    .order("price", { ascending: true })
    .returns<Offer[]>();

  if (error) {
    return databaseFailure(error, "Не удалось получить предложения.");
  }

  return serviceSuccess(data ?? []);
}

export async function submitOffer(
  input: OfferCreateInput,
): Promise<ServiceResult<Offer>> {
  const { data, error } = await supabase
    .from("offers")
    .upsert(
      {
        request_id: input.request_id,
        company_id: input.company_id,
        price: input.price,
        currency: "RUB",
        proposed_days: input.proposed_days ?? null,
        message: input.message?.trim() || null,
        status: "submitted",
      },
      { onConflict: "request_id,company_id" },
    )
    .select("*, company:companies(id, name, city)")
    .single<Offer>();

  if (error) {
    return databaseFailure(error, "Не удалось отправить предложение.");
  }

  return serviceSuccess(data);
}

export async function acceptOffer(
  offerId: string,
): Promise<ServiceResult<string>> {
  const { data, error } = await supabase.rpc("accept_offer", {
    p_offer_id: offerId,
  });

  if (error) {
    return databaseFailure(error, "Не удалось принять предложение.");
  }

  return serviceSuccess(data as string);
}

// OP-023: Contractor Journey — "Мои отклики".
//
// getOffersForRequest() is scoped to one request (customer-side view of
// competing offers). This is the contractor-side view: every offer this
// company has submitted, across all requests, most recent first.
export async function listCompanyOffers(
  companyId: string,
): Promise<ServiceResult<(Offer & { request: Request })[]>> {
  const { data, error } = await supabase
    .from("offers")
    .select("*, request:requests(*)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .returns<(Offer & { request: Request })[]>();

  if (error) {
    return databaseFailure(error, "Не удалось получить ваши отклики.");
  }

  return serviceSuccess(data ?? []);
}
