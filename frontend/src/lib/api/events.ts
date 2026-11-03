const DATA_CHANGED_EVENT = "nigertoday:data-changed";

export function emitDataChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
}

export function onDataChanged(callback: () => void): () => void {
  window.addEventListener(DATA_CHANGED_EVENT, callback);
  return () => window.removeEventListener(DATA_CHANGED_EVENT, callback);
}