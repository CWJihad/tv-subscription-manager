import { getMeta } from "@/lib/api";

let cachedToday: string | null = null;
let inFlight: Promise<string> | null = null;

/**
 * The ONLY place that defines "today" (YYYY-MM-DD).
 * The value comes from GET /meta and is cached by loadToday() (called by <TodayProvider>).
 * Pages render only after <TodayProvider> finished loading, so this is always safe inside the app.
 */
export function getToday(): string {
  if (cachedToday === null) {
    throw new Error("getToday() was called before today was loaded. Render inside <TodayProvider>.");
  }
  return cachedToday;
}

/** Fetches /meta (one request at a time) and caches `today`. */
export function loadToday(): Promise<string> {
  if (!inFlight) {
    inFlight = getMeta()
      .then((meta) => {
        cachedToday = meta.today;
        return meta.today;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}