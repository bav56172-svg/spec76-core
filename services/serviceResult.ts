import type {
  ServiceError,
  ServiceErrorCode,
  ServiceResult,
} from "@/types/service-result";

function isMessageBearingError(
  error: unknown,
): error is { message: string; code?: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  );
}

export function createServiceError(
  code: ServiceErrorCode,
  message: string,
  cause?: unknown,
): ServiceError {
  return {
    code,
    message,
    ...(cause === undefined ? {} : { cause }),
  };
}

export function serviceFailure<T>(
  code: ServiceErrorCode,
  message: string,
  cause?: unknown,
): ServiceResult<T> {
  return {
    data: null,
    error: createServiceError(code, message, cause),
  };
}

export function serviceSuccess<T>(data: T): ServiceResult<T> {
  return {
    data,
    error: null,
  };
}

export function databaseFailure<T>(
  error: unknown,
  fallbackMessage: string,
): ServiceResult<T> {
  const message = isMessageBearingError(error)
    ? error.message
    : fallbackMessage;

  return serviceFailure(
    "DATABASE_ERROR",
    message || fallbackMessage,
    error,
  );
}
