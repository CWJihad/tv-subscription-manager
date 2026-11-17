import type { CustomerFieldErrors } from "@/types";

export type ApiErrorCode = "NOT_FOUND" | "VALIDATION" | "UNKNOWN";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly fieldErrors: CustomerFieldErrors | undefined;
  /** HTTP status when the error came from the server (undefined for network errors). */
  readonly status: number | undefined;

  constructor(
    code: ApiErrorCode,
    message: string,
    fieldErrors?: CustomerFieldErrors,
    status?: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.status = status;
  }
}