import type { Customer } from "@/types";
import { getStatus } from "@/lib/status";

export interface NavCounts {
  expiring: number;
  expired: number;
}

export function getNavCounts(
  customers: readonly Customer[],
  today: string,
): NavCounts {
  let expiring = 0;
  let expired = 0;
  for (const customer of customers) {
    const { status } = getStatus(customer.expiryDate, today);
    if (status === "expiring") expiring += 1;
    else if (status === "expired") expired += 1;
  }
  return { expiring, expired };
}