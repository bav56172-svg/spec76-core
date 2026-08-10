import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  databaseFailure,
  serviceFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import type { ServiceResult } from "@/types/service-result";

export const AI_RATE_LIMIT_MAX_REQUESTS = 10;
export const AI_RATE_LIMIT_WINDOW_SECONDS = 60;

export interface AiRateLimitDecision {
  allowed: boolean;
  limit: number;
  used: number;
  windowSeconds: number;
  retryAfterSeconds: number;
}

export interface AiUsageRecord {
  id: string;
  request_id: string;
  project_id: string;
  company_id: string;
  user_id: string;
  operation_type: string;
  status: "reserved" | "completed" | "failed";
  provider: string | null;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface ReserveAiUsageInput {
  actorUserId: string;
  projectId: string;
  operationType: string;
  requestId: string;
}

export interface FinalizeAiUsageInput {
  actorUserId: string;
  requestId: string;
  status: "completed" | "failed";
  provider?: string | null;
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "";
}

function rpcFailure<T>(error: unknown): ServiceResult<T> {
  const message = getErrorMessage(error);

  if (message.includes("AI_RATE_LIMIT_EXCEEDED")) {
    return serviceFailure(
      "RATE_LIMITED",
      "Слишком много запросов к ИИ. Повторите попытку через минуту.",
      error,
    );
  }

  if (
    message.includes("AI_USAGE_PROJECT_ACCESS_DENIED") ||
    message.includes("AI_USAGE_FINALIZE_ACCESS_DENIED")
  ) {
    return serviceFailure(
      "FORBIDDEN",
      "Нет доступа к ИИ-операциям этого проекта.",
      error,
    );
  }

  if (
    message.includes("AI_USAGE_REQUEST_ID_CONFLICT") ||
    message.includes("AI_USAGE_TERMINAL_STATE_CONFLICT")
  ) {
    return serviceFailure(
      "CONFLICT",
      "Состояние ИИ-операции конфликтует с текущим запросом.",
      error,
    );
  }

  if (message.includes("AI_USAGE_NOT_FOUND")) {
    return serviceFailure(
      "NOT_FOUND",
      "Запись ИИ-операции не найдена.",
      error,
    );
  }

  if (
    message.includes("AI_USAGE_INVALID_REQUEST") ||
    message.includes("AI_USAGE_INVALID_FINALIZATION")
  ) {
    return serviceFailure(
      "VALIDATION_ERROR",
      "Параметры ИИ-операции некорректны.",
      error,
    );
  }

  return databaseFailure(
    error,
    "Не удалось обработать учёт использования ИИ.",
  );
}

function toAiUsageRecord(data: unknown): AiUsageRecord | null {
  const candidate = Array.isArray(data) ? data[0] : data;

  if (
    typeof candidate !== "object" ||
    candidate === null ||
    !("id" in candidate) ||
    typeof candidate.id !== "string" ||
    !("request_id" in candidate) ||
    typeof candidate.request_id !== "string" ||
    !("status" in candidate) ||
    !["reserved", "completed", "failed"].includes(String(candidate.status))
  ) {
    return null;
  }

  return candidate as unknown as AiUsageRecord;
}

export class UsageBilling {
  static getLimit(): number {
    return AI_RATE_LIMIT_MAX_REQUESTS;
  }

  static async checkRateLimit(
    supabase: SupabaseClient,
    userId: string,
    now = new Date(),
  ): Promise<ServiceResult<AiRateLimitDecision>> {
    const windowStartedAt = new Date(
      now.getTime() - AI_RATE_LIMIT_WINDOW_SECONDS * 1000,
    ).toISOString();

    const { count, error } = await supabase
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", windowStartedAt);

    if (error) {
      return databaseFailure(
        error,
        "Не удалось проверить ограничение ИИ-запросов.",
      );
    }

    const used = count ?? 0;
    const allowed = used < AI_RATE_LIMIT_MAX_REQUESTS;

    return serviceSuccess({
      allowed,
      limit: AI_RATE_LIMIT_MAX_REQUESTS,
      used,
      windowSeconds: AI_RATE_LIMIT_WINDOW_SECONDS,
      retryAfterSeconds: allowed ? 0 : AI_RATE_LIMIT_WINDOW_SECONDS,
    });
  }

  static async reserve(
    input: ReserveAiUsageInput,
  ): Promise<ServiceResult<AiUsageRecord>> {
    const { data, error } = await getSupabaseAdminClient().rpc(
      "reserve_ai_usage",
      {
        p_actor_user_id: input.actorUserId,
        p_project_id: input.projectId,
        p_operation_type: input.operationType,
        p_request_id: input.requestId,
      },
    );

    if (error) {
      return rpcFailure(error);
    }

    const record = toAiUsageRecord(data);

    if (!record) {
      return serviceFailure(
        "DATABASE_ERROR",
        "База данных вернула некорректную запись ИИ-операции.",
      );
    }

    return serviceSuccess(record);
  }

  static async finalize(
    input: FinalizeAiUsageInput,
  ): Promise<ServiceResult<AiUsageRecord>> {
    const { data, error } = await getSupabaseAdminClient().rpc(
      "finalize_ai_usage",
      {
        p_actor_user_id: input.actorUserId,
        p_request_id: input.requestId,
        p_status: input.status,
        p_provider: input.provider ?? null,
        p_model: input.model ?? null,
        p_input_tokens: input.inputTokens ?? null,
        p_output_tokens: input.outputTokens ?? null,
      },
    );

    if (error) {
      return rpcFailure(error);
    }

    const record = toAiUsageRecord(data);

    if (!record) {
      return serviceFailure(
        "DATABASE_ERROR",
        "База данных вернула некорректное состояние ИИ-операции.",
      );
    }

    return serviceSuccess(record);
  }

  static async track(): Promise<ServiceResult<never>> {
    return serviceFailure(
      "CONFLICT",
      "Прямая запись использования ИИ запрещена. Используйте атомарные reserve/finalize операции.",
    );
  }
}
