import type {
  Customer,
  CustomerFilter,
  CustomerWithStatus,
  ExpiringBucket,
  ExpiringRange,
  StatusCounts,
} from "@/types";

export function countByStatus(customers: readonly CustomerWithStatus[]): StatusCounts {
  const counts: StatusCounts = { total: customers.length, active: 0, expiring: 0, expired: 0 };
  for (const customer of customers) counts[customer.status] += 1;
  return counts;
}

export function filterByStatus(
  customers: readonly CustomerWithStatus[],
  filter: CustomerFilter,
): CustomerWithStatus[] {
  if (filter === "all") return [...customers];
  return customers.filter((customer) => customer.status === filter);
}

/** 0 days left goes into "1-3". */
export function getExpiringBucket(daysLeft: number): ExpiringBucket {
  if (daysLeft <= 3) return "1-3";
  if (daysLeft <= 7) return "4-7";
  return "8-10";
}

export function filterByExpiringRange(
  customers: readonly CustomerWithStatus[],
  range: ExpiringRange,
): CustomerWithStatus[] {
  if (range === "all") return [...customers];
  return customers.filter((customer) => getExpiringBucket(customer.daysLeft) === range);
}

export function countByExpiringRange(
  customers: readonly CustomerWithStatus[],
): Record<ExpiringRange, number> {
  const counts: Record<ExpiringRange, number> = { all: customers.length, "1-3": 0, "4-7": 0, "8-10": 0 };
  for (const customer of customers) counts[getExpiringBucket(customer.daysLeft)] += 1;
  return counts;
}

/** Smallest days left first. */
export function sortExpiring(customers: readonly CustomerWithStatus[]): CustomerWithStatus[] {
  return [...customers].sort(
    (a, b) => a.daysLeft - b.daysLeft || a.fullName.localeCompare(b.fullName),
  );
}

/** Most recently expired first. */
export function sortExpired(customers: readonly CustomerWithStatus[]): CustomerWithStatus[] {
  return [...customers].sort(
    (a, b) => b.daysLeft - a.daysLeft || a.fullName.localeCompare(b.fullName),
  );
}

const PHONE_QUERY_RE = /^[\d\s+()-]+$/;

/** Case-insensitive match on name, phone or email. */
export function searchCustomers<T extends Pick<Customer, "fullName" | "email" | "phone">>(
  customers: readonly T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...customers];
  const digits = PHONE_QUERY_RE.test(q) ? q.replace(/\D/g, "") : "";
  return customers.filter(
    (customer) =>
      customer.fullName.toLowerCase().includes(q) ||
      customer.email.toLowerCase().includes(q) ||
      customer.phone.toLowerCase().includes(q) ||
      (digits !== "" && customer.phone.replace(/\D/g, "").includes(digits)),
  );
}