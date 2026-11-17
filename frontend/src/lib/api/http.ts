import type { CustomerField, CustomerFieldErrors } from "@/types";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  parseTokens,
  setSession,
} from "@/lib/session";
import { ApiError } from "./errors";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Send the Bearer token. Default true. Login uses false. */
  auth?: boolean;
  /** On 401: refresh the tokens and retry once. Default true. Logout uses false. */
  refreshOn401?: boolean;
}

interface RawResponse {
  status: number;
  ok: boolean;
  body: unknown;
}

/** A request that takes longer than this fails with a normal error instead of hanging forever. */
const REQUEST_TIMEOUT_MS = 15_000;

const VALIDATION_MESSAGE = "Please check the details and try again.";
const NETWORK_MESSAGE = "Could not reach the server. Check your connection and try again.";
const TIMEOUT_MESSAGE = "The server took too long to respond. Please try again.";
const GENERIC_MESSAGE = "Something went wrong. Please try again.";
const UNEXPECTED_MESSAGE = "Unexpected response from the server. Please try again.";
const SESSION_EXPIRED_MESSAGE = "Your session expired. Please log in again.";
const PHONE_EXISTS_MESSAGE = "Phone number already exists";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readMessage(body: unknown): string | null {
  if (isRecord(body) && typeof body.message === "string" && body.message.length > 0) {
    return body.message;
  }
  return null;
}

/** Success body: { code, message, data: { type, attributes } } -> attributes. */
function readAttributes(body: unknown): unknown {
  return isRecord(body) && isRecord(body.data) ? body.data.attributes : undefined;
}

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new ApiError("UNKNOWN", "API URL is not configured. Set NEXT_PUBLIC_API_URL.");
  }
  return url.replace(/\/+$/, "");
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
  }
  const queryString = params.toString();
  return `${getBaseUrl()}${path}${queryString ? `?${queryString}` : ""}`;
}

/* ------------------------------------------------------------------ */
/* Validation message parser.                                          */
/* The backend sends ONE message string, e.g.                          */
/*   "fullName" length must be at least 2 characters long              */
/* This is the only place that knows that. When the backend sends a    */
/* fieldErrors object, replace parseFieldErrors() and nothing else.    */
/* ------------------------------------------------------------------ */

const CUSTOMER_FIELDS: readonly CustomerField[] = [
  "fullName",
  "email",
  "phone",
  "startDate",
  "durationMonths",
];

const FIELD_LABELS: Record<CustomerField, string> = {
  fullName: "Full name",
  email: "Email",
  phone: "Phone number",
  startDate: "Start date",
  durationMonths: "Duration",
};

// Matches `"field" some text` up to the next `, "otherField" ` or the end.
const FIELD_ERROR_RE = /"([A-Za-z]\w*)"\s+(.+?)(?=,\s+"[A-Za-z]\w*"\s|$)/g;

function isCustomerField(value: string): value is CustomerField {
  return (CUSTOMER_FIELDS as readonly string[]).includes(value);
}

function parseFieldErrors(message: string): CustomerFieldErrors | undefined {
  const errors: CustomerFieldErrors = {};

  // "Enter a valid phone number" has no quoted field name.
  if (/valid phone number/i.test(message)) errors.phone = message;

  for (const match of message.matchAll(FIELD_ERROR_RE)) {
    const field = match[1];
    const detail = match[2];
    if (!field || !detail || !isCustomerField(field) || errors[field]) continue;
    errors[field] = `${FIELD_LABELS[field]} ${detail.trim()}`;
  }

  return Object.keys(errors).length > 0 ? errors : undefined;
}

function toApiError(status: number, body: unknown): ApiError {
  const message = readMessage(body) ?? GENERIC_MESSAGE;

  if (status === 404) return new ApiError("NOT_FOUND", message, undefined, status);

  if (status === 400) {
    // An invalid id in the URL (not a Mongo id) means "no such customer".
    if (/^"id"/.test(message)) {
      return new ApiError("NOT_FOUND", "Customer not found.", undefined, status);
    }
    const fieldErrors = parseFieldErrors(message);
    return fieldErrors
      ? new ApiError("VALIDATION", VALIDATION_MESSAGE, fieldErrors, status)
      : new ApiError("VALIDATION", message, undefined, status);
  }

  if (status === 409 && message === PHONE_EXISTS_MESSAGE) {
    return new ApiError("VALIDATION", VALIDATION_MESSAGE, { phone: message }, status);
  }

  // Includes 401, 403, 429, 5xx and the renew conflict 409.
  return new ApiError("UNKNOWN", message, undefined, status);
}

/* ------------------------------------------------------------------ */
/* Transport                                                           */
/* ------------------------------------------------------------------ */

async function send(
  path: string,
  options: RequestOptions,
  accessToken: string | null,
): Promise<RawResponse> {
  const url = buildUrl(path, options.query);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  // The timer covers the whole exchange (headers AND body), so nothing can stay pending forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await response.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = undefined;
    }

    return { status: response.status, ok: response.ok, body };
  } catch {
    throw new ApiError("UNKNOWN", controller.signal.aborted ? TIMEOUT_MESSAGE : NETWORK_MESSAGE);
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Token refresh. Refresh tokens are SINGLE-USE, so every refresh      */
/* goes through one shared promise. It always settles (send() has a    */
/* timeout) and is always reset in finally().                          */
/* ------------------------------------------------------------------ */

let refreshInFlight: Promise<boolean> | null = null;

/** true = new tokens saved. false = the server rejected the refresh token. Throws on network error or timeout. */
async function performRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const raw = await send(
    "/auth/refresh-tokens",
    { method: "POST", body: { refreshToken } },
    null,
  );
  if (!raw.ok) return false;

  const attributes = readAttributes(raw.body);
  const tokens = isRecord(attributes) ? parseTokens(attributes.tokens) : null;
  if (!tokens) return false;

  setSession(tokens);
  return true;
}

function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** Refresh failed: clear the session (AuthGuard sends the user to /login). Never calls logout. */
function endSession(): never {
  clearSession();
  throw new ApiError("UNKNOWN", SESSION_EXPIRED_MESSAGE, undefined, 401);
}

async function retryAfterRefresh(
  path: string,
  options: RequestOptions,
  usedToken: string | null,
): Promise<RawResponse> {
  const currentToken = getAccessToken();
  // If another request already refreshed (the token changed), just retry with the new one.
  if (!currentToken || currentToken === usedToken) {
    const refreshed = await refreshSession();
    if (!refreshed) return endSession();
  }

  const raw = await send(path, options, getAccessToken());
  if (raw.status === 401) return endSession();
  return raw;
}

async function execute(path: string, options: RequestOptions): Promise<unknown> {
  const useAuth = options.auth !== false;
  const usedToken = useAuth ? getAccessToken() : null;

  let raw = await send(path, options, usedToken);
  if (raw.status === 401 && useAuth && options.refreshOn401 !== false) {
    raw = await retryAfterRefresh(path, options, usedToken);
  }

  // Any 2xx (200, 201, ...) is success.
  if (!raw.ok) throw toApiError(raw.status, raw.body);
  return raw.body;
}

/** Returns `data.attributes` of a success response. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const body = await execute(path, options);
  const attributes = readAttributes(body);
  if (attributes === undefined) throw new ApiError("UNKNOWN", UNEXPECTED_MESSAGE);
  return attributes as T;
}

/** For calls where the response body does not matter (logout, delete). */
export async function requestVoid(path: string, options: RequestOptions = {}): Promise<void> {
  await execute(path, options);
}