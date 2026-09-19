/** Tiny browser event bus so unrelated components can react to changes (for example the notification bell). */

const NOTIFICATIONS_CHANGED = "ucl-hub:notifications-changed";

export function emitNotificationsChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
}

export function onNotificationsChanged(listener: () => void): () => void {
  window.addEventListener(NOTIFICATIONS_CHANGED, listener);
  return () => window.removeEventListener(NOTIFICATIONS_CHANGED, listener);
}
