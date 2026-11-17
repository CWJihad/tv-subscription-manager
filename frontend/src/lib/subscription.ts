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