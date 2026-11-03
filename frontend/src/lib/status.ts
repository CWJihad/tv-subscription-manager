// getStatus(expiryDate, today), counts, sorters, filter helpers

import { EXPIRING_WINDOW_DAYS } from "@/lib/constants";
import { diffInDays } from "@/lib/dates";
import type { Customer, CustomerWithStatus, StatusInfo } from "@/types";

/** Pure. Active: > 10 days left. Expiring: 0–10. Expired: < 0. */
export function getStatus(expiryDate: string, today: string): StatusInfo {
  const daysLeft = diffInDays(today, expiryDate);
  if (daysLeft < 0) return { status: "expired", daysLeft };
  if (daysLeft <= EXPIRING_WINDOW_DAYS) return { status: "expiring", daysLeft };
  return { status: "active", daysLeft };
}

export function withStatus(customer: Customer, today: string): CustomerWithStatus {
  return { ...customer, ...getStatus(customer.expiryDate, today) };
}