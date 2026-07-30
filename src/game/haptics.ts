export type HapticEvent =
  | "success"
  | "gold"
  | "purple-first"
  | "purple-done"
  | "combo"
  | "gameover";

const PATTERNS: Record<HapticEvent, number | number[]> = {
  success: 18,
  gold: [14, 40, 14],
  "purple-first": 8,
  "purple-done": [14, 40, 14],
  combo: [20, 40, 20, 40, 40],
  gameover: [60, 50, 140],
};

let enabled = true;

export function setVibrationEnabled(value: boolean) {
  enabled = value;
}

export function vibrate(event: HapticEvent) {
  if (!enabled) return;
  try {
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
    navigator.vibrate(PATTERNS[event]);
  } catch {
    /* unsupported — fail silently */
  }
}
