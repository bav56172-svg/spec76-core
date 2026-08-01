export type ServiceErrorCode =
  | "AUTH_REQUIRED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "FORBIDDEN"
  | "DATABASE_ERROR"
  | "UNKNOWN_ERROR";

export interface ServiceError {
  code: ServiceErrorCode;
  message: string;
  cause?: unknown;
}

export type ServiceResult<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: ServiceError;
    };
