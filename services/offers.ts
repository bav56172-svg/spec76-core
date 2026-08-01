import {
  databaseFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type { Offer, OfferCreateInput } from "@/types/offer";
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
