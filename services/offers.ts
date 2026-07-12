import { supabase } from "@/services/supabase";
import type { Offer, OfferCreateInput } from "@/types/offer";

export async function getOffersForRequest(requestId: string) {
  return await supabase
    .from("offers")
    .select("*, company:companies(id, name, city)")
    .eq("request_id", requestId)
    .order("price", { ascending: true })
    .returns<Offer[]>();
}

export async function submitOffer(input: OfferCreateInput) {
  return await supabase
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
}

export async function acceptOffer(offerId: string) {
  const { error } = await supabase.rpc("accept_offer", {
    p_offer_id: offerId,
  });

  if (error) {
    return { data: null, error };
  }

  return { data: true, error: null };
}
