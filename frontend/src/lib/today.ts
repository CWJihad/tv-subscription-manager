// MOCK_TODAY + getToday() (the only place "today" is defined)

/** Development "today". Matches the design. */
export const MOCK_TODAY = "2026-10-05";

/**
 * The ONLY place that defines "today" (YYYY-MM-DD).
 * To switch to the real date later, replace the return line with:
 *   const now = new Date();
 *   return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
 */
export function getToday(): string {
  return MOCK_TODAY;
}