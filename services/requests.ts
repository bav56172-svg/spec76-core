import { supabase } from "@/services/supabase";
import type { Request, RequestCreateInput } from "@/types/request";

export async function createRequest(input: RequestCreateInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { data: null, error: userError };
  }

  if (!user) {
    return {
      data: null,
      error: new Error("Для создания заявки необходимо войти в систему."),
    };
  }

  return await supabase
    .from("requests")
    .insert({
      customer_id: user.id,
      title: input.title.trim(),
      description: input.description.trim(),
      city: input.city.trim(),
      location_text: input.location_text?.trim() || null,
      urgency: input.urgency,
      desired_start_at: input.desired_start_at || null,
      status: "draft",
    })
    .select("*")
    .single<Request>();
}

export async function getRequest(id: string) {
  return await supabase
    .from("requests")
    .select("*")
    .eq("id", id)
    .single<Request>();
}

export async function getMyRequests() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: userError ?? new Error("Пользователь не найден.") };
  }

  return await supabase
    .from("requests")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Request[]>();
}
