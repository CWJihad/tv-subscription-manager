const KEY = "nigertoday:session";

export function hasSession(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setSession(): void {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    /* storage blocked: ignore */
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: ignore */
  }
}