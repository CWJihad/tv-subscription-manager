import { useEffect, useMemo, useSyncExternalStore } from "react";
import { getSelf } from "@/lib/api";
import { getInitials } from "@/lib/format";
import { hasSession, onSessionChanged } from "@/lib/session";
import type { SelfUser } from "@/types";

export interface Owner {
  name: string;
  initials: string;
  role: string;
}

const OWNER_ROLE = "Business owner";

/** Shown until GET /users/self/in answers. */
const FALLBACK_OWNER: Owner = { name: "Owner", initials: "O", role: OWNER_ROLE };

type SelfStatus = "idle" | "loading" | "ready" | "failed";

interface SelfState {
  status: SelfStatus;
  self: SelfUser | null;
}

const IDLE: SelfState = { status: "idle", self: null };

let state: SelfState = IDLE;
let generation = 0; // bumps on every load, set and reset, so old answers are ignored
let watching = false;
const listeners = new Set<() => void>();

function setState(next: SelfState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

/** When the session ends (logout, failed refresh) forget the owner. */
function watchSession(): void {
  if (watching || typeof window === "undefined") return;
  watching = true;
  onSessionChanged(() => {
    if (hasSession()) return;
    generation += 1; // ignore any answer that is still on its way
    if (state !== IDLE) setState(IDLE); // nothing to reset = no update
  });
}

function subscribe(listener: () => void): () => void {
  watchSession();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = (): SelfState => state;
const getServerSnapshot = (): SelfState => IDLE;

export function loadSelf(): void {
  // No session = nothing to ask. This also stops a request -> 401 -> reset -> request loop.
  if (state.status === "loading" || !hasSession()) return;
  generation += 1;
  const mine = generation;
  setState({ status: "loading", self: state.self });
  getSelf()
    .then((self) => {
      if (mine === generation) setState({ status: "ready", self });
    })
    .catch(() => {
      if (mine === generation) setState({ status: "failed", self: state.self });
    });
}

/** Call after a successful PATCH /users/self/update. */
export function setSelf(self: SelfUser): void {
  generation += 1;
  setState({ status: "ready", self });
}

export function useSelf(): {
  self: SelfUser | null;
  loading: boolean;
  failed: boolean;
  retry: () => void;
} {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (current.status === "idle") loadSelf();
  }, [current.status]);

  return {
    self: current.self,
    loading: current.status === "idle" || current.status === "loading",
    failed: current.status === "failed",
    retry: loadSelf,
  };
}

/** For the sidebar and header: { name, initials, role }. */
export function useOwner(): Owner {
  const { self } = useSelf();
  return useMemo(
    () =>
      self
        ? { name: self.fullName, initials: getInitials(self.fullName), role: OWNER_ROLE }
        : FALLBACK_OWNER,
    [self],
  );
}