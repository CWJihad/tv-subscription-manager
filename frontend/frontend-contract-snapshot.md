# Code snapshot
Generated: 2026-11-15T17:35:27.815Z

## src/types/auth.ts

```ts
export interface LoginInput {
  identifier: string;
  password: string;
}

export interface LoginFieldErrors {
  identifier?: string;
  password?: string;
}
```

## src/types/customer.ts

```ts
// DurationMonths, SubscriptionStatus, Payment, Renewal, Customer, input types
export type DurationMonths = 3 | 6 | 12;

/** Computed by the API from dates. Never stored. */
export type SubscriptionStatus = "active" | "expiring" | "expired";

export type PaymentMethod = "cash" | "bkash" | "nagad" | "rocket" | "bank_transfer" | "other";
export type PaymentStatus = "paid" | "unpaid";

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  method: PaymentMethod | null;
  status: PaymentStatus;
  paidAt: string | null; // YYYY-MM-DD
  note: string | null;
}

/** Request body for the optional `payment` block and for PUT .../payment. */
export interface PaymentInput {
  amount: number;
  status: PaymentStatus;
  method?: PaymentMethod; // paid only
  paidAt?: string; // YYYY-MM-DD, paid only
  note?: string;
}

export interface Renewal {
  id: string;
  kind: "first" | "renewal";
  durationMonths: DurationMonths;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  payment: Payment | null;
}

/** List item fields (GET /customers). No renewals. */
export interface Customer {
  id: string;
  fullName: string;
  email: string; // "" when empty
  phone: string; // +8801XXXXXXXXX
  customerSince: string; // YYYY-MM-DD
  currentStartDate: string; // start of the CURRENT subscription period
  durationMonths: DurationMonths;
  expiryDate: string; // YYYY-MM-DD
  remindersEnabled: boolean;
}

/** Detail (GET /customers/:id). */
export interface CustomerDetail extends Customer {
  renewals: Renewal[]; // oldest first
}

export interface StatusInfo {
  status: SubscriptionStatus;
  daysLeft: number; // negative when expired
}

export type CustomerWithStatus = Customer & StatusInfo;
export type CustomerDetailWithStatus = CustomerDetail & StatusInfo;

export interface CreateCustomerInput {
  fullName: string;
  email: string;
  phone: string;
  startDate: string; // YYYY-MM-DD
  durationMonths: DurationMonths;
  payment?: PaymentInput;
}

export type UpdateCustomerInput = Pick<Customer, "fullName" | "email" | "phone">;

export type CustomerField =
  | "fullName"
  | "email"
  | "phone"
  | "startDate"
  | "durationMonths";

export type CustomerFieldErrors = Partial<Record<CustomerField, string>>;

export type CustomerFilter = "all" | "active" | "expiring" | "expired";
export type ExpiringRange = "all" | "1-3" | "4-7" | "8-10";
export type ExpiringBucket = Exclude<ExpiringRange, "all">;

export interface StatusCounts {
  total: number;
  active: number;
  expiring: number;
  expired: number;
}

/** GET /customers/stats */
export interface CustomerStats extends StatusCounts {
  expiringBuckets: Record<ExpiringBucket, number>;
}

export interface PaymentSummary {
  revenueThisMonth: number;
  currency: string;
  paidCount: number;
  unpaidCount: number;
}

export interface DashboardSummary {
  today: string; // YYYY-MM-DD, from the backend
  counts: StatusCounts; // exact counts from the API
  needsAttention: number; // expiring + expired
  expiring: CustomerWithStatus[]; // smallest days left first (max 100)
  expired: CustomerWithStatus[]; // most recently expired first (max 100)
  payments: PaymentSummary;
}
```

## src/types/index.ts

```ts
// re-exports
export * from './customer'
export * from './auth'
export * from './meta'
export * from './payment'
export * from './settings'
```

## src/types/meta.ts

```ts
/** GET /meta */
export interface Meta {
  today: string; // YYYY-MM-DD
  timezone: string; // e.g. Asia/Dhaka
  currency: string; // e.g. BDT
  expiringWindowDays: number;
}
```

## src/types/payment.ts

```ts
import type { PaymentMethod } from "./customer";

/** What the payment form edits. Everything is a string, as typed by the user. */
export interface PaymentFormValues {
  amount: string;
  method: PaymentMethod | "";
  paidAt: string; // YYYY-MM-DD
  note: string;
  unpaid: boolean;
}

export type PaymentField = "amount" | "method" | "paidAt" | "note";
export type PaymentFieldErrors = Partial<Record<PaymentField, string>>;
```

## src/types/settings.ts

```ts
export interface PriceSettings {
  m3: number | null;
  m6: number | null;
  m12: number | null;
}

export type ReminderChannel = "email" | "whatsapp";

export interface ReminderTemplates {
  d7: string;
  d3: string;
  d1: string;
  expired: string;
}

/** GET /settings. Only `prices` is used in pass 2a. The rest is for checklist item 15. */
export interface Settings {
  remind7Days: boolean;
  remind3Days: boolean;
  remind1Day: boolean;
  remindExpired: boolean;
  reminderChannels: ReminderChannel[];
  reminderSendHour: number;
  reminderTemplates: ReminderTemplates;
  prices: PriceSettings;
}
```

## src/lib/api/errors.ts

```ts
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
```

## src/lib/api/events.ts

```ts
const DATA_CHANGED_EVENT = "nigertoday:data-changed";

export function emitDataChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
}

export function onDataChanged(callback: () => void): () => void {
  window.addEventListener(DATA_CHANGED_EVENT, callback);
  return () => window.removeEventListener(DATA_CHANGED_EVENT, callback);
}
```

## src/lib/api/http.ts

```ts
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
```

## src/lib/api/index.ts

```ts
// Real HTTP client. Same function names and signatures as the old mock.

import { DURATION_OPTIONS } from "@/lib/constants";
import { clearSession, getRefreshToken, parseTokens, setSession } from "@/lib/session";
import type {
  CreateCustomerInput,
  CustomerDetailWithStatus,
  CustomerStats,
  CustomerWithStatus,
  DashboardSummary,
  DurationMonths,
  LoginInput,
  Meta,
  PaymentInput,
  Renewal,
  Settings,
  UpdateCustomerInput,
} from "@/types";
import { ApiError } from "./errors";
import { emitDataChanged } from "./events";
import { request, requestVoid } from "./http";

export { ApiError } from "./errors";
export type { ApiErrorCode } from "./errors";

const CUSTOMERS_PAGE_LIMIT = 100; // backend max. Pagination UI comes later.

interface Paginated<T> {
  results: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

const customerPath = (id: string): string => `/customers/${encodeURIComponent(id)}`;

/* ----------------------------- meta ------------------------------ */

export async function getMeta(): Promise<Meta> {
  return request<Meta>("/meta");
}

/* ---------------------------- settings --------------------------- */

export async function getSettings(): Promise<Settings> {
  return request<Settings>("/settings");
}

/* ----------------------------- auth ------------------------------ */

export async function login(input: LoginInput): Promise<void> {
  try {
    // The form field is "identifier"; the backend field is "email".
    const attributes = await request<{ tokens?: unknown }>("/auth/login", {
      method: "POST",
      body: { email: input.identifier.trim(), password: input.password },
      auth: false, // a 401 here means wrong credentials: never run the refresh flow
    });
    const tokens = parseTokens(attributes.tokens);
    if (!tokens) throw new ApiError("UNKNOWN", "Could not log in. Please try again.");
    setSession(tokens);
  } catch (error) {
    if (error instanceof ApiError && error.code === "VALIDATION") {
      throw new ApiError("VALIDATION", "Enter a valid email and password.");
    }
    throw error;
  }
}

/** Calls POST /auth/logout, then ALWAYS clears the session, even if the call fails. */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await requestVoid("/auth/logout", {
        method: "POST",
        body: { refreshToken },
        refreshOn401: false,
      });
    }
  } catch {
    /* ignore: the local session is cleared below either way */
  } finally {
    clearSession();
  }
}

/* --------------------------- customers --------------------------- */

export async function getCustomers(): Promise<CustomerWithStatus[]> {
  const page = await request<Paginated<CustomerWithStatus>>("/customers", {
    query: { limit: CUSTOMERS_PAGE_LIMIT },
  });
  return page.results;
}

/** Counts for tabs and nav badges. Optional search text `q`. */
export async function getCustomerStats(q?: string): Promise<CustomerStats> {
  return request<CustomerStats>("/customers/stats", { query: { q } });
}

export async function getCustomer(id: string): Promise<CustomerDetailWithStatus> {
  return request<CustomerDetailWithStatus>(customerPath(id));
}

export async function createCustomer(
  input: CreateCustomerInput,
): Promise<CustomerDetailWithStatus> {
  const customer = await request<CustomerDetailWithStatus>("/customers", {
    method: "POST",
    body: {
      fullName: input.fullName.trim(),
      phone: input.phone.trim(), // sent as typed, the backend normalizes it
      email: input.email.trim(),
      startDate: input.startDate,
      durationMonths: input.durationMonths,
      ...(input.payment ? { payment: input.payment } : {}),
    },
  });
  emitDataChanged();
  return customer;
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput,
): Promise<CustomerDetailWithStatus> {
  const customer = await request<CustomerDetailWithStatus>(customerPath(id), {
    method: "PATCH",
    body: {
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
    },
  });
  emitDataChanged();
  return customer;
}

/** New expiry = max(current expiry, today) + duration (see lib/subscription.ts). Payment is optional. */
export async function renewCustomer(
  id: string,
  durationMonths: DurationMonths,
  payment?: PaymentInput,
): Promise<CustomerDetailWithStatus> {
  if (!DURATION_OPTIONS.includes(durationMonths)) {
    throw new ApiError("VALIDATION", "Choose a valid renewal duration.");
  }
  try {
    const customer = await request<CustomerDetailWithStatus>(`${customerPath(id)}/renew`, {
      method: "POST",
      body: { durationMonths, ...(payment ? { payment } : {}) },
    });
    emitDataChanged();
    return customer;
  } catch (error) {
    // 409 "Subscription was changed...": data is stale, tell listeners to refetch.
    if (error instanceof ApiError && error.status === 409) emitDataChanged();
    throw error;
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  await requestVoid(customerPath(id), { method: "DELETE" });
  emitDataChanged();
}

/** Records or edits the payment of one renewal. Returns the updated renewal item. */
export async function upsertPayment(
  customerId: string,
  renewalId: string,
  input: PaymentInput,
): Promise<Renewal> {
  const renewal = await request<Renewal>(
    `${customerPath(customerId)}/renewals/${encodeURIComponent(renewalId)}/payment`,
    { method: "PUT", body: input },
  );
  emitDataChanged();
  return renewal;
}

/* --------------------------- dashboard --------------------------- */

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return request<DashboardSummary>("/dashboard/summary");
}
```

## src/hooks/useCustomerModals.tsx

```tsx
"use client";

import { useState, type ReactNode } from "react";
import { RenewModal } from "@/components/customers/RenewModal";
import { ReminderModal } from "@/components/customers/ReminderModal";
import type { CustomerWithStatus } from "@/types";

export function useCustomerModals(onChanged?: () => void): {
  openRenew: (customer: CustomerWithStatus) => void;
  openReminder: (customer: CustomerWithStatus) => void;
  modals: ReactNode;
} {
  const [renewTarget, setRenewTarget] = useState<CustomerWithStatus | null>(null);
  const [reminderTarget, setReminderTarget] = useState<CustomerWithStatus | null>(null);

  const modals = (
    <>
      <RenewModal
        customer={renewTarget}
        onClose={() => setRenewTarget(null)}
        onRenewed={onChanged}
      />
      <ReminderModal customer={reminderTarget} onClose={() => setReminderTarget(null)} />
    </>
  );

  return {
    openRenew: (customer) => setRenewTarget(customer),
    openReminder: (customer) => setReminderTarget(customer),
    modals,
  };
}
```

## src/hooks/useDashboardSummary.ts

```ts
"use client";

import { useEffect, useState } from "react";
import { getDashboardSummary } from "@/lib/api";
import type { DashboardSummary } from "@/types";

export function useDashboardSummary() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getDashboardSummary()
      .then((data) => {
        if (cancelled) return;
        setSummary(data);
        setFailed(false);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setFailed(false);
    setReloadKey((key) => key + 1);
  };

  return { summary, loading, failed, retry };
}
```

## src/hooks/useLogout.ts

```ts
"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/api";

export function useLogout(): () => void {
  const router = useRouter();
  return async () => {
    await logout()
    router.replace("/login");
  };
}
```

## src/hooks/useNavCounts.ts

```ts
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getCustomerStats } from "@/lib/api";
import { onDataChanged } from "@/lib/api/events";
import type { NavCounts } from "@/lib/nav-counts";

const EMPTY_COUNTS: NavCounts = { expiring: 0, expired: 0 };

async function loadCounts(): Promise<NavCounts> {
  try {
    const stats = await getCustomerStats()
    return {expiring: stats.expiring, expired: stats.expired}
  } catch {
    return EMPTY_COUNTS;
  }
}

export function useNavCounts(): NavCounts {
  const pathname = usePathname();
  const [counts, setCounts] = useState<NavCounts>(EMPTY_COUNTS);

  // Refetch on route change. setState only runs inside the promise callback.
  useEffect(() => {
    let cancelled = false;
    void loadCounts().then((next) => {
      if (!cancelled) setCounts(next);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Refetch when /lib/api mutations emit "nigertoday:data-changed".
  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onDataChanged(() => {
      void loadCounts().then((next) => {
        if (!cancelled) setCounts(next);
      });
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return counts;
}
```

## src/hooks/usePaymentForm.ts

```ts
"use client";

import { useState } from "react";
import {
  DEFAULT_PAYMENT_METHOD,
  getPrefillAmount,
  hasPaymentErrors,
  paymentToFormValues,
  toPaymentInput,
  validatePayment,
} from "@/lib/payment";
import { getToday } from "@/lib/today";
import type {
  DurationMonths,
  Payment,
  PaymentFieldErrors,
  PaymentFormValues,
  PaymentInput,
  PriceSettings,
} from "@/types";

interface Options {
  prices: PriceSettings | null;
  /** Used for the amount prefill. null = no prefill. */
  durationMonths: DurationMonths | null;
  /** Is the payment block on when the form opens? */
  defaultEnabled: boolean;
  /** Start from a saved payment (edit mode). */
  initialPayment?: Payment | null;
}

function withoutError(
  errors: PaymentFieldErrors,
  field: keyof PaymentFormValues,
): PaymentFieldErrors {
  if (field === "unpaid") return {}; // the rules change, so old errors no longer apply
  if (!errors[field]) return errors;
  const next = { ...errors };
  delete next[field];
  return next;
}

/**
 * Only the fields the user changed are stored ("edits").
 * Everything else is derived, so the amount follows the selected duration and the
 * saved price until the user types their own amount. No effects needed.
 */
export function usePaymentForm({
  prices,
  durationMonths,
  defaultEnabled,
  initialPayment,
}: Options) {
  const [enabled, setEnabledState] = useState(defaultEnabled);
  const [edits, setEdits] = useState<Partial<PaymentFormValues>>(() =>
    initialPayment ? paymentToFormValues(initialPayment) : {},
  );
  const [errors, setErrors] = useState<PaymentFieldErrors>({});

  const values: PaymentFormValues = {
    amount: edits.amount ?? getPrefillAmount(prices, durationMonths),
    method: edits.method ?? DEFAULT_PAYMENT_METHOD,
    paidAt: edits.paidAt ?? getToday(),
    note: edits.note ?? "",
    unpaid: edits.unpaid ?? false,
  };

  function setEnabled(next: boolean): void {
    setEnabledState(next);
    setErrors({});
  }

  function setField<K extends keyof PaymentFormValues>(field: K, value: PaymentFormValues[K]): void {
    setEdits((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => withoutError(previous, field));
  }

  /** true = ok to submit. A turned-off block is always ok. */
  function validate(): boolean {
    if (!enabled) return true;
    const next = validatePayment(values);
    setErrors(next);
    return !hasPaymentErrors(next);
  }

  /** The `payment` request block, or undefined when the block is off. */
  function toInput(): PaymentInput | undefined {
    return enabled ? toPaymentInput(values) : undefined;
  }

  function reset(): void {
    setEnabledState(defaultEnabled);
    setEdits(initialPayment ? paymentToFormValues(initialPayment) : {});
    setErrors({});
  }

  return { enabled, setEnabled, values, errors, setField, validate, toInput, reset };
}
```

## src/hooks/usePrices.ts

```ts
"use client";

import { useEffect, useState } from "react";
import { getSettings } from "@/lib/api";
import type { PriceSettings } from "@/types";

/**
 * Loads the saved prices once when the component mounts (only if `enabled`).
 * A failure is not an error for the user: the amount field just starts empty.
 */
export function usePrices(enabled = true): { prices: PriceSettings | null; loading: boolean } {
  const [prices, setPrices] = useState<PriceSettings | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    getSettings()
      .then((settings) => {
        if (!cancelled) setPrices(settings.prices);
      })
      .catch(() => {
        /* no prefill */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { prices, loading };
}
```

## src/hooks/useToast.ts

```ts
import { useContext } from "react";
import { ToastContext, type ToastContextValue } from "@/components/ui/ToastProvider";

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
```

## src/lib/payment.ts

```ts
// Pure payment helpers: options, money format, amount parsing, validation, request body.

import { isValidISODate } from "@/lib/dates";
import { formatLongDate } from "@/lib/format";
import type {
  DurationMonths,
  Payment,
  PaymentField,
  PaymentFieldErrors,
  PaymentFormValues,
  PaymentInput,
  PaymentMethod,
  PriceSettings,
} from "@/types";

export const DEFAULT_CURRENCY = "BDT";
export const DEFAULT_PAYMENT_METHOD: PaymentMethod = "cash";
export const NOTE_MAX_LENGTH = 200;

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "other", label: "Other" },
];

export function isPaymentMethod(value: string): value is PaymentMethod {
  return PAYMENT_METHOD_OPTIONS.some((option) => option.value === value);
}

export function getMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ?? method;
}

const CURRENCY_SYMBOLS: Record<string, string> = { BDT: "৳" };
const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** ৳1,500 (BDT) or "USD 1,500" for other currencies. */
export function formatMoney(amount: number, currency: string = DEFAULT_CURRENCY): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const value = numberFormat.format(amount);
  return symbol ? `${symbol}${value}` : `${currency} ${value}`;
}

/* ------------------------------ prices ------------------------------ */

export function getPriceForDuration(
  prices: PriceSettings | null,
  months: DurationMonths,
): number | null {
  if (!prices) return null;
  if (months === 3) return prices.m3;
  if (months === 6) return prices.m6;
  return prices.m12;
}

/** Text for the amount field: the saved price, or "" when there is none. */
export function getPrefillAmount(
  prices: PriceSettings | null,
  months: DurationMonths | null,
): string {
  if (months === null) return "";
  const price = getPriceForDuration(prices, months);
  return price === null ? "" : String(price);
}

/* ------------------------------ amount ------------------------------ */

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

/** "1500", "1,500", "1500.50" -> number. Anything else -> null. */
export function parseAmount(text: string): number | null {
  const cleaned = text.trim().replace(/,/g, "");
  if (!AMOUNT_RE.test(cleaned)) return null;
  return Number(cleaned);
}

/* ---------------------------- validation ---------------------------- */

/** Mirrors the backend rules. Paid: amount > 0, method, date. Unpaid: amount only. */
export function validatePayment(values: PaymentFormValues): PaymentFieldErrors {
  const errors: PaymentFieldErrors = {};

  if (values.amount.trim() === "") {
    errors.amount = "Enter the amount";
  } else {
    const amount = parseAmount(values.amount);
    if (amount === null) errors.amount = "Enter a valid amount (up to 2 decimals)";
    else if (!values.unpaid && amount <= 0) errors.amount = "Amount must be more than 0";
  }

  if (!values.unpaid) {
    if (values.method === "") errors.method = "Choose a payment method";
    if (!isValidISODate(values.paidAt)) errors.paidAt = "Choose a valid payment date";
  }

  if (values.note.trim().length > NOTE_MAX_LENGTH) {
    errors.note = `Note must be ${NOTE_MAX_LENGTH} characters or less`;
  }

  return errors;
}

export function hasPaymentErrors(errors: PaymentFieldErrors): boolean {
  return (Object.keys(errors) as PaymentField[]).length > 0;
}

/** Request body. Call only after validatePayment() returned no errors. */
export function toPaymentInput(values: PaymentFormValues): PaymentInput {
  const input: PaymentInput = {
    amount: parseAmount(values.amount) ?? 0,
    status: values.unpaid ? "unpaid" : "paid",
    note: values.note.trim(), // always sent, so an old note can be cleared
  };
  if (!values.unpaid) {
    if (values.method !== "") input.method = values.method;
    input.paidAt = values.paidAt;
  }
  return input;
}

/** Starting values when editing a saved payment. Missing method/date fall back to the defaults. */
export function paymentToFormValues(payment: Payment): Partial<PaymentFormValues> {
  const values: Partial<PaymentFormValues> = {
    amount: String(payment.amount),
    note: payment.note ?? "",
    unpaid: payment.status === "unpaid",
  };
  if (payment.method) values.method = payment.method;
  if (payment.paidAt) values.paidAt = payment.paidAt;
  return values;
}

/* ------------------------------ display ----------------------------- */

export type PaymentTone = "success" | "warning" | "neutral";

export function getPaymentBadge(payment: Payment | null): { label: string; tone: PaymentTone } {
  if (!payment) return { label: "Not recorded", tone: "neutral" };
  if (payment.status === "paid") return { label: "Paid", tone: "success" };
  return { label: "Unpaid", tone: "warning" };
}

/** "৳1,500 · Cash · Apr 8, 2026" (paid) or "৳1,500" (unpaid). */
export function getPaymentSummaryText(payment: Payment): string {
  const parts = [formatMoney(payment.amount, payment.currency)];
  if (payment.status === "paid") {
    if (payment.method) parts.push(getMethodLabel(payment.method));
    if (payment.paidAt) parts.push(formatLongDate(payment.paidAt));
  }
  return parts.join(" · ");
}
```

## src/lib/reminders.ts

```ts
import { formatLongDate, getFirstName } from "@/lib/format";
import type { Customer } from "@/types";

export type ReminderTemplate = "7" | "3" | "1" | "expired";

export const REMINDER_TEMPLATES: { value: ReminderTemplate; label: string }[] = [
  { value: "7", label: "7 days left" },
  { value: "3", label: "3 days left" },
  { value: "1", label: "1 day left" },
  { value: "expired", label: "Expired" },
];

export function getDefaultTemplate(daysLeft: number): ReminderTemplate {
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 1) return "1";
  if (daysLeft <= 3) return "3";
  return "7";
}

export function getReminderMessage(
  customer: Pick<Customer, "fullName" | "expiryDate">,
  template: ReminderTemplate,
): string {
  const name = getFirstName(customer.fullName);
  const date = formatLongDate(customer.expiryDate);
  if (template === "expired") {
    return `Hi ${name}, your TV subscription expired on ${date}. Please renew to get your service back. Thank you!`;
  }
  const left = template === "1" ? "1 day left" : `${template} days left`;
  return `Hi ${name}, your TV subscription expires on ${date} (${left}). Please renew to keep your service running. Thank you!`;
}
```

## src/lib/validation.ts

```ts
import { DURATION_OPTIONS } from "@/lib/constants";
import { isValidISODate } from "@/lib/dates";
import type { CreateCustomerInput, CustomerFieldErrors, UpdateCustomerInput, LoginInput, LoginFieldErrors } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS_RE = /^\+?[\d\s()-]+$/;

/** Name and phone required, email optional. Phone: 7-15 digits (the backend normalizes it to +8801XXXXXXXXX). */
export function validateContact(input: UpdateCustomerInput): CustomerFieldErrors {
  const errors: CustomerFieldErrors = {};
  const name = input.fullName.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();

  if (!name) errors.fullName = "Full name is required";

  if (!phone) {
    errors.phone = "Phone number is required";
  } else {
    const digitCount = phone.replace(/\D/g, "").length;
    if (!PHONE_CHARS_RE.test(phone) || digitCount < 7 || digitCount > 15) {
      errors.phone = "Enter a valid phone number";
    }
  }

  if (email && !EMAIL_RE.test(email)) errors.email = "Enter a valid email address";

  return errors;
}

export function validateCreateCustomer(input: CreateCustomerInput): CustomerFieldErrors {
  const errors = validateContact(input);
  if (!isValidISODate(input.startDate)) errors.startDate = "Choose a valid start date";
  if (!DURATION_OPTIONS.includes(input.durationMonths)) errors.durationMonths = "Choose a duration";
  return errors;
}

export function hasErrors(errors: CustomerFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Both fields required (whitespace-only counts as empty). No email format check here: the backend answers "Enter a valid email and password." */
export function validateLogin(input: LoginInput): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  if (!input.identifier.trim()) errors.identifier = "Enter your email";
  if (!input.password.trim()) errors.password = "Enter your password";
  return errors;
}

export function hasLoginErrors(errors: LoginFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
```

## src/lib/customer-validation.ts

```ts
import { validateContact } from "@/lib/validation";
import { isValidISODate } from "@/lib/dates";
import type { CustomerFieldErrors } from "@/types";

export interface CustomerFormValues {
  fullName: string;
  email: string;
  phone: string;
  startDate?: string;
}

export function validateCustomer(values: CustomerFormValues): CustomerFieldErrors {
  const errors = validateContact(values);
  if (values.startDate !== undefined && !isValidISODate(values.startDate)) {
    errors.startDate = "Choose a valid start date";
  }
  return errors;
}
```

## src/lib/format.ts

```ts
// labels and date formats (all formats from project-context.md)

import { parseISODate } from "@/lib/dates";
import type { DurationMonths, SubscriptionStatus } from "@/types";

const OPTIONS_BASE = { timeZone: "UTC" } as const;

const longFormat = new Intl.DateTimeFormat("en-US", {
  ...OPTIONS_BASE,
  month: "short",
  day: "numeric",
  year: "numeric",
});
const shortFormat = new Intl.DateTimeFormat("en-US", {
  ...OPTIONS_BASE,
  month: "short",
  day: "numeric",
});
const fullWithWeekdayFormat = new Intl.DateTimeFormat("en-US", {
  ...OPTIONS_BASE,
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const fullMonthFormat = new Intl.DateTimeFormat("en-US", {
  ...OPTIONS_BASE,
  month: "long",
  day: "numeric",
  year: "numeric",
});

/** Oct 8, 2026 */
export function formatLongDate(iso: string): string {
  return longFormat.format(parseISODate(iso));
}

/** Oct 8 */
export function formatShortDate(iso: string): string {
  return shortFormat.format(parseISODate(iso));
}

/** Monday, October 5, 2026 */
export function formatFullDate(iso: string): string {
  return fullWithWeekdayFormat.format(parseISODate(iso));
}

/** October 5, 2026 (Add Customer date field) */
export function formatFullMonthDate(iso: string): string {
  return fullMonthFormat.format(parseISODate(iso));
}

/** Table "Expires" column: "Oct 8" in the same year as today, otherwise "Jan 5, 2027". */
export function formatTableDate(iso: string, today: string): string {
  return iso.slice(0, 4) === today.slice(0, 4) ? formatShortDate(iso) : formatLongDate(iso);
}

function pluralDays(count: number): string {
  return `${count} ${count === 1 ? "day" : "days"}`;
}

/** "3 days left", "1 day left", "Expires today", "2 days ago", "1 day ago" */
export function getRemainingLabel(daysLeft: number): string {
  if (daysLeft > 0) return `${pluralDays(daysLeft)} left`;
  if (daysLeft === 0) return "Expires today";
  return `${pluralDays(Math.abs(daysLeft))} ago`;
}

/** Table status pill text: "Active" for healthy subscriptions, otherwise the remaining label. */
export function getStatusLabel(status: SubscriptionStatus, daysLeft: number): string {
  return status === "active" ? "Active" : getRemainingLabel(daysLeft);
}

/** Dashboard list: "Expired 2 days ago" */
export function getExpiredAgoLabel(daysLeft: number): string {
  return `Expired ${getRemainingLabel(daysLeft)}`;
}

/** "3 months" */
export function formatDuration(months: DurationMonths): string {
  return `${months} months`;
}

/** "3 mo" */
export function formatDurationShort(months: DurationMonths): string {
  return `${months} mo`;
}

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts.at(0)?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? "") : "";
  return (first + last).toUpperCase();
}

export function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/).at(0) ?? "";
}
```

## src/lib/today.ts

```ts
import { getMeta } from "@/lib/api";

let cachedToday: string | null = null;
let inFlight: Promise<string> | null = null;

/**
 * The ONLY place that defines "today" (YYYY-MM-DD).
 * The value comes from GET /meta and is cached by loadToday() (called by <TodayProvider>).
 * Pages render only after <TodayProvider> finished loading, so this is always safe inside the app.
 */
export function getToday(): string {
  if (cachedToday === null) {
    throw new Error("getToday() was called before today was loaded. Render inside <TodayProvider>.");
  }
  return cachedToday;
}

/** Fetches /meta (one request at a time) and caches `today`. */
export function loadToday(): Promise<string> {
  if (!inFlight) {
    inFlight = getMeta()
      .then((meta) => {
        cachedToday = meta.today;
        return meta.today;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}
```

## src/lib/dates.ts

```ts
// pure UTC date math: parse, format, addMonths (clamped), diffInDays

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function tryParseISODate(iso: string): Date | null {
  const match = ISO_DATE_RE.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isSameDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  return isSameDate ? date : null;
}

export function isValidISODate(iso: string): boolean {
  return tryParseISODate(iso) !== null;
}

/** Parses YYYY-MM-DD as a UTC date. Throws on invalid input. */
export function parseISODate(iso: string): Date {
  const date = tryParseISODate(iso);
  if (!date) throw new Error(`Invalid ISO date: ${iso}`);
  return date;
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** Adds calendar months. If the day does not exist in the target month, uses the last day of it. */
export function addMonths(iso: string, months: number): string {
  const date = parseISODate(iso);
  const total = date.getUTCMonth() + months;
  const year = date.getUTCFullYear() + Math.floor(total / 12);
  const monthIndex = ((total % 12) + 12) % 12;
  const day = Math.min(date.getUTCDate(), daysInMonth(year, monthIndex));
  return toISODate(new Date(Date.UTC(year, monthIndex, day)));
}

/** Whole calendar days from `from` to `to`. Negative when `to` is before `from`. */
export function diffInDays(from: string, to: string): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / MS_PER_DAY);
}
```

## src/lib/session.ts

```ts
const KEY = "nigertoday:auth";
const LEGACY_KEY = "nigertoday:session"; // old mock flag, removed on login/logout
const SESSION_EVENT = "nigertoday:session-changed";

export interface AuthToken {
  token: string;
  expires: string; // ISO date-time from the backend
}

export interface AuthTokens {
  access: AuthToken;
  refresh: AuthToken;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseToken(value: unknown): AuthToken | null {
  if (!isRecord(value)) return null;
  const { token, expires } = value;
  if (typeof token !== "string" || token.length === 0 || typeof expires !== "string") return null;
  return { token, expires };
}

/** Validates the shape of `tokens` from login / refresh-tokens (or from storage). */
export function parseTokens(value: unknown): AuthTokens | null {
  if (!isRecord(value)) return null;
  const access = parseToken(value.access);
  const refresh = parseToken(value.refresh);
  return access && refresh ? { access, refresh } : null;
}

function readTokens(): AuthTokens | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? parseTokens(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function notify(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EVENT));
}

export function getAccessToken(): string | null {
  return readTokens()?.access.token ?? null;
}

export function getRefreshToken(): string | null {
  return readTokens()?.refresh.token ?? null;
}

/** Logged in = we hold a refresh token that has not expired yet. */
export function hasSession(): boolean {
  const tokens = readTokens();
  if (!tokens) return false;
  return Date.parse(tokens.refresh.expires) > Date.now();
}

/** Used after login and after every token refresh. */
export function setSession(tokens: AuthTokens): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(tokens));
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* storage blocked: ignore */
  }
  notify();
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* storage blocked: ignore */
  }
  notify();
}

/** Fires on changes in this tab (custom event) and in other tabs (storage event). */
export function onSessionChanged(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(SESSION_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SESSION_EVENT, callback);
  };
}
```

## src/lib/owner.ts

```ts
export const OWNER = {
  name: "Alex Owner",
  initials: "AO",
  role: "Business owner",
} as const;
```

## src/lib/constants.ts

```ts
import type { DurationMonths } from "@/types";

export const DURATION_OPTIONS: readonly DurationMonths[] = [3, 6, 12];

/** Active = more than this many days left. Expiring = this many or fewer. */
export const EXPIRING_WINDOW_DAYS = 10;

```

## src/lib/subscription.ts

```ts
import { addMonths, diffInDays } from "@/lib/dates";
import type { DurationMonths } from "@/types";

/** Renewal starts from the current expiry, or from today if the subscription already expired. */
export function getRenewalBase(currentExpiry: string, today: string): string {
  return diffInDays(today, currentExpiry) >= 0 ? currentExpiry : today;
}

export interface RenewalPreview {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD (new expiry)
}

/** Same math as the backend: base = max(currentExpiry, today), to = base + months. */
export function getRenewalPreview(
  currentExpiry: string,
  today: string,
  months: DurationMonths,
): RenewalPreview {
  const from = getRenewalBase(currentExpiry, today);
  return { from, to: addMonths(from, months) };
}
```

## src/lib/tones.ts

```ts
export type Tone = "neutral" | "primary" | "success" | "warning" | "danger";
export type StatusTone = "success" | "warning" | "danger";

export interface ToneClasses {
  soft: string;       // tinted background
  strong: string;     // icon / number colour
  badgeText: string;  // text on tinted background
  dot: string;
  fill: string;       // solid fill (progress bar)
  border: string;     // solid border (toast)
  softBorder: string; // subtle border (banner)
}

export const toneClasses: Record<Tone, ToneClasses> = {
  neutral: {
    soft: "bg-neutral-100", strong: "text-neutral-900", badgeText: "text-neutral-700",
    dot: "bg-neutral-500", fill: "bg-neutral-500", border: "border-neutral-200", softBorder: "border-neutral-200",
  },
  primary: {
    soft: "bg-primary-50", strong: "text-primary-600", badgeText: "text-primary-700",
    dot: "bg-primary-600", fill: "bg-primary-600", border: "border-primary-600", softBorder: "border-primary-600/30",
  },
  success: {
    soft: "bg-success-50", strong: "text-success-600", badgeText: "text-success-700",
    dot: "bg-success-600", fill: "bg-success-600", border: "border-success-600", softBorder: "border-success-600/30",
  },
  warning: {
    soft: "bg-warning-50", strong: "text-warning-600", badgeText: "text-warning-700",
    dot: "bg-warning-600", fill: "bg-warning-600", border: "border-warning-600", softBorder: "border-warning-600/30",
  },
  danger: {
    soft: "bg-danger-50", strong: "text-danger-600", badgeText: "text-danger-700",
    dot: "bg-danger-600", fill: "bg-danger-600", border: "border-danger-600", softBorder: "border-danger-600/30",
  },
};
```

