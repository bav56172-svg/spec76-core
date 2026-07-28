import {
  serviceFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type { ServiceResult } from "@/types/service-result";

export async function requestEmailSignIn(
  email: string,
): Promise<ServiceResult<null>> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return serviceFailure(
      "VALIDATION_ERROR",
      "Введите корректный адрес электронной почты.",
    );
  }

  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/`
      : undefined;

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    return serviceFailure(
      "UNKNOWN_ERROR",
      "Не удалось отправить ссылку для входа. Повторите попытку.",
      error,
    );
  }

  return serviceSuccess(null);
}
