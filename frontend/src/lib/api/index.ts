// Real HTTP client. Same function names and signatures as the old mock.

import { DURATION_OPTIONS } from "@/lib/constants";
import { clearSession, getRefreshToken, parseTokens, setSession } from "@/lib/session";
import type {
  ChangePasswordInput,
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
  SelfUser,
  Settings,
  UpdateCustomerInput,
  UpdateSelfInput,
  UpdateSettingsInput,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/* ----------------------------- meta ------------------------------ */

export async function getMeta(): Promise<Meta> {
  return request<Meta>("/meta");
}

/* ---------------------------- settings --------------------------- */

export async function getSettings(): Promise<Settings> {
  return request<Settings>("/settings");
}

/** Partial update. Send only the changed fields. Returns the full saved settings. */
export async function updateSettings(input: UpdateSettingsInput): Promise<Settings> {
  return request<Settings>("/settings", { method: "PATCH", body: input });
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

/**
 * POST /auth/change-password. The session stays valid.
 * Wrong current password and "same as old" are 400s (not 401), so they never trigger a token refresh.
 */
export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await requestVoid("/auth/change-password", {
    method: "POST",
    body: { oldPassword: input.oldPassword, newPassword: input.newPassword },
  });
}

/* ----------------------------- account --------------------------- */

function toSelfUser(value: unknown): SelfUser {
  if (!isRecord(value) || typeof value.fullName !== "string" || typeof value.email !== "string") {
    throw new ApiError("UNKNOWN", "Unexpected response from the server. Please try again.");
  }
  return {
    id: typeof value.id === "string" ? value.id : "",
    fullName: value.fullName,
    email: value.email,
  };
}

export async function getSelf(): Promise<SelfUser> {
  return toSelfUser(await request<unknown>("/users/self/in"));
}

/** fullName and email only. Send only what changed. */
export async function updateSelf(input: UpdateSelfInput): Promise<SelfUser> {
  return toSelfUser(
    await request<unknown>("/users/self/update", { method: "PATCH", body: input }),
  );
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