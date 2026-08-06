/**
 * Document scroll lock used only while a run is on screen or a full-screen
 * modal is open.
 *
 * Rules learned the hard way on iOS WKWebView:
 * - Always CLEAR the inline styles on release. Restoring a previously captured
 *   value can latch `hidden` permanently across nested locks.
 * - Lock both <html> and <body>; the document element is the real scroller.
 * - Never attach a `touchmove` listener to lock scrolling. CSS only.
 */
let lockedScrollY = 0;
let locked = false;

export function setBodyScrollLock(active: boolean): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  const body = document.body;

  if (active) {
    if (!locked) lockedScrollY = window.scrollY || html.scrollTop || 0;
    locked = true;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return;
  }

  html.style.overflow = "";
  body.style.overflow = "";
  body.style.position = "";
  body.style.top = "";
  body.style.width = "";
  body.classList.remove("scroll-locked");
  if (locked) {
    locked = false;
    const y = lockedScrollY;
    lockedScrollY = 0;
    // Restore where the player was before the lock.
    requestAnimationFrame(() => window.scrollTo(0, y));
  }
}

/** Unconditionally release the lock (unmount, app resume, error recovery). */
export function releaseBodyScrollLock(): void {
  setBodyScrollLock(false);
}

/** True when the document is currently scroll-locked. Used by tests/diagnostics. */
export function isBodyScrollLocked(): boolean {
  return locked;
}
