"use client";

import { useSettings } from "@/hooks/useSettings";
import type { PriceSettings } from "@/types";

/**
 * Saved prices, loaded once when the component mounts (only if `enabled`).
 * A failure is not an error for the user: the amount field just starts empty.
 */
export function usePrices(enabled = true): { prices: PriceSettings | null; loading: boolean } {
  const { settings, loading } = useSettings(enabled);
  return { prices: settings?.prices ?? null, loading };
}