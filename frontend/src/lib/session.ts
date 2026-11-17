const KEY = "nigertoday:auth";
const LEGACY_KEY = "nigertoday:session"; // old mock flag, removed on login/logout
const SESSION_EVENT = "nigertoday:session-changed";

export interface AuthToken {
  token: string;
  expires: string; // ISO date-time from the backend
}

export interface AuthTokens {
  access: AuthToken;
  refresh: AuthToken;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseToken(value: unknown): AuthToken | null {
  if (!isRecord(value)) return null;
  const { token, expires } = value;
  if (typeof token !== "string" || token.length === 0 || typeof expires !== "string") return null;
  return { token, expires };
}

/** Validates the shape of `tokens` from login / refresh-tokens (or from storage). */
export function parseTokens(value: unknown): AuthTokens | null {
  if (!isRecord(value)) return null;
  const access = parseToken(value.access);
  const refresh = parseToken(value.refresh);
  return access && refresh ? { access, refresh } : null;
}

function readTokens(): AuthTokens | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? parseTokens(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function notify(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EVENT));
}

export function getAccessToken(): string | null {
  return readTokens()?.access.token ?? null;
}

export function getRefreshToken(): string | null {
  return readTokens()?.refresh.token ?? null;
}

/** Logged in = we hold a refresh token that has not expired yet. */
export function hasSession(): boolean {
  const tokens = readTokens();
  if (!tokens) return false;
  return Date.parse(tokens.refresh.expires) > Date.now();
}

/** Used after login and after every token refresh. */
export function setSession(tokens: AuthTokens): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(tokens));
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* storage blocked: ignore */
  }
  notify();
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* storage blocked: ignore */
  }
  notify();
}

/** Fires on changes in this tab (custom event) and in other tabs (storage event). */
export function onSessionChanged(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(SESSION_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SESSION_EVENT, callback);
  };
}