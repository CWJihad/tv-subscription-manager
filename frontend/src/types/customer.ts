// DurationMonths, SubscriptionStatus, Renewal, Customer, input types
export type DurationMonths = 3 | 6 | 12;

/** Computed from dates. Never stored. */
export type SubscriptionStatus = "active" | "expiring" | "expired";

export interface Renewal {
  id: string;
  kind: "first" | "renewal";
  durationMonths: DurationMonths;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  customerSince: string; // YYYY-MM-DD
  currentStartDate: string; // start of the CURRENT subscription period
  durationMonths: DurationMonths;
  expiryDate: string; // YYYY-MM-DD
  renewals: Renewal[]; // oldest first
}

export interface StatusInfo {
  status: SubscriptionStatus;
  daysLeft: number; // negative when expired
}

export type CustomerWithStatus = Customer & StatusInfo;

export interface CreateCustomerInput {
  fullName: string;
  email: string;
  phone: string;
  startDate: string; // YYYY-MM-DD
  durationMonths: DurationMonths;
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

export interface DashboardSummary {
  counts: StatusCounts;
  needsAttention: number; // expiring + expired
  expiring: CustomerWithStatus[]; // smallest days left first
  expired: CustomerWithStatus[]; // most recently expired first
}