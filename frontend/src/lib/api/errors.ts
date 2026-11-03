import type { CustomerFieldErrors } from "@/types";

export type ApiErrorCode = "NOT_FOUND" | "VALIDATION" | "UNKNOWN";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly fieldErrors: CustomerFieldErrors | undefined;

  constructor(code: ApiErrorCode, message: string, fieldErrors?: CustomerFieldErrors) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}