/**
 * Body scroll lock used only while a run is on screen.
 *
 * Always clears the inline style when released: restoring a previously captured
 * value can latch `hidden` permanently (nested/re-entrant locks) which kills
 * scrolling for good inside the native WebView.
 */
export function setBodyScrollLock(active: boolean): void {
  if (typeof document === "undefined") return;
  document.body.style.overflow = active ? "hidden" : "";
}

/** Unconditionally release the lock (unmount, app resume, error recovery). */
export function releaseBodyScrollLock(): void {
  setBodyScrollLock(false);
}
