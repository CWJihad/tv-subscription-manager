import type { DurationMonths } from "@/types";

export const DURATION_OPTIONS: readonly DurationMonths[] = [3, 6, 12];

/** Active = more than this many days left. Expiring = this many or fewer. */
export const EXPIRING_WINDOW_DAYS = 10;

export const MOCK_LATENCY_MS = 300;