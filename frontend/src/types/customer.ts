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