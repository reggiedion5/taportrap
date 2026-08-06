/**
 * Tap timing classification and close-call detection.
 *
 * Everything is expressed as a fraction of the *current* response window so a
 * Perfect stays achievable at every difficulty tier — the window shrinks, the
 * thresholds scale with it.
 */

export type TapTiming = "perfect" | "great" | "good";

/** fastest 15% of the window */
export const PERFECT_RATIO = 0.15;
/** the next 25% (so Great ends at 40% of the window) */
export const GREAT_RATIO = 0.4;
/** final 10% of the window counts as a close call */
export const CLOSE_CALL_RATIO = 0.9;

function safeWindow(windowMs: number): number {
  return Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 1;
}

export function classifyTap(elapsedMs: number, windowMs: number): TapTiming {
  const win = safeWindow(windowMs);
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : win;
  const ratio = elapsed / win;
  if (ratio <= PERFECT_RATIO) return "perfect";
  if (ratio <= GREAT_RATIO) return "great";
  return "good";
}

/** A tap is never both Perfect and a Close Call — perfect wins by definition. */
export function isCloseCall(elapsedMs: number, windowMs: number): boolean {
  const win = safeWindow(windowMs);
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  if (classifyTap(elapsed, win) === "perfect") return false;
  return elapsed / win >= CLOSE_CALL_RATIO && elapsed <= win;
}

const CLOSE_CALL_MESSAGES = ["CLUTCH", "LAST SECOND", "PHEW!", "ON THE BUZZER"];

export function closeCallMessage(elapsedMs: number, windowMs: number): string {
  const left = Math.max(0, safeWindow(windowMs) - Math.max(0, elapsedMs || 0));
  // roughly a third of the time, show the exact margin instead of a phrase
  if (Math.random() < 0.34) return `${(left / 1000).toFixed(2)}s LEFT`;
  return CLOSE_CALL_MESSAGES[Math.floor(Math.random() * CLOSE_CALL_MESSAGES.length)];
}

export const TIMING_LABEL: Record<TapTiming, string> = {
  perfect: "PERFECT",
  great: "GREAT",
  good: "GOOD",
};
