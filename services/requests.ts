import {
  databaseFailure,
  serviceFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type { Request, RequestCreateInput } from "@/types/request";
import type { ServiceResult } from "@/types/service-result";

export async function createRequest(
  input: RequestCreateInput,
): Promise<ServiceResult<Request>> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return databaseFailure(userError, "Не удалось проверить пользователя.");
  }

  if (!user) {
    return serviceFailure(
      "AUTH_REQUIRED",
      "Для создания заявки необходимо войти в систему.",
    );
  }

  const { data, error } = await supabase
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

  if (error) {
    return databaseFailure(error, "Не удалось создать заявку.");
  }

  return serviceSuccess(data);
}

export async function getRequest(
  id: string,
): Promise<ServiceResult<Request>> {
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("id", id)
    .single<Request>();

  if (error) {
    return databaseFailure(error, "Не удалось получить заявку.");
  }

  return serviceSuccess(data);
}

export async function getMyRequests(): Promise<ServiceResult<Request[]>> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return databaseFailure(userError, "Не удалось проверить пользователя.");
  }

  if (!user) {
    return serviceFailure(
      "AUTH_REQUIRED",
      "Пользователь не найден.",
    );
  }

  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Request[]>();

  if (error) {
    return databaseFailure(error, "Не удалось получить заявки.");
  }

  return serviceSuccess(data ?? []);
}
