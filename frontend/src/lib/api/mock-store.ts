// in-memory state, async delay, `?empty=1` / env switch

import { MOCK_LATENCY_MS } from "@/lib/constants";
import { SEED_CUSTOMERS } from "@/lib/mock-data/customers";
import type { Customer } from "@/types";

export function cloneCustomer(customer: Customer): Customer {
  return { ...customer, renewals: customer.renewals.map((renewal) => ({ ...renewal })) };
}

/**
 * Dev flags (client only, remembered in sessionStorage):
 *   ?empty=1  -> empty data (test empty states). ?empty=0 turns it off.
 *   ?fail=1   -> createCustomer fails (test error toast). ?fail=0 turns it off.
 * Env alternatives: NEXT_PUBLIC_MOCK_EMPTY=1, NEXT_PUBLIC_MOCK_FAIL=1
 */
function readFlag(name: string, envValue: string | undefined): boolean {
  if (envValue === "1") return true;
  if (typeof window === "undefined") return false;
  const storageKey = `mock-${name}`;
  try {
    const param = new URLSearchParams(window.location.search).get(name);
    if (param === "1") {
      window.sessionStorage.setItem(storageKey, "1");
      return true;
    }
    if (param === "0") {
      window.sessionStorage.removeItem(storageKey);
      return false;
    }
    return window.sessionStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

export function isEmptyMode(): boolean {
  return readFlag("empty", process.env.NEXT_PUBLIC_MOCK_EMPTY);
}

export function shouldFailSave(): boolean {
  return readFlag("fail", process.env.NEXT_PUBLIC_MOCK_FAIL);
}

const stores: { seed: Customer[]; empty: Customer[] } = {
  seed: SEED_CUSTOMERS.map(cloneCustomer),
  empty: [],
};

let customerCounter = SEED_CUSTOMERS.length;
let renewalCounter = 0;

export function getList(): Customer[] {
  return isEmptyMode() ? stores.empty : stores.seed;
}

export function setList(next: Customer[]): void {
  if (isEmptyMode()) stores.empty = next;
  else stores.seed = next;
}

export function nextCustomerId(): string {
  customerCounter += 1;
  return `c_${String(customerCounter).padStart(3, "0")}`;
}

export function nextRenewalId(): string {
  renewalCounter += 1;
  return `r_n${String(renewalCounter).padStart(3, "0")}`;
}

export function simulateLatency(ms: number = MOCK_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}