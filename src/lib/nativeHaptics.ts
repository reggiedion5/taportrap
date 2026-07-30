/**
 * Haptics service.
 *
 * Native platforms use the Capacitor Haptics plugin; browsers fall back to
 * `navigator.vibrate` when supported. Exactly one of the two paths ever runs,
 * both fail silently, and everything is gated on the player's vibration
 * setting.
 */

import { isNativePlatform, isPluginAvailable } from "./nativePlatform";

export type HapticEvent =
  | "lightTap"
  | "mediumTap"
  | "heavyTap"
  | "success"
  | "warning"
  | "error"
  | "goldReward"
  | "purpleFirstTap"
  | "purpleComplete"
  | "comboMilestone"
  | "levelUp"
  | "gameOver";

type ImpactStyle = "LIGHT" | "MEDIUM" | "HEAVY";
type NotificationStyle = "SUCCESS" | "WARNING" | "ERROR";

interface HapticsPlugin {
  impact: (options: { style: ImpactStyle }) => Promise<void>;
  notification: (options: { type: NotificationStyle }) => Promise<void>;
}

type Recipe =
  | { kind: "impact"; style: ImpactStyle; web: number | number[] }
  | { kind: "notification"; style: NotificationStyle; web: number | number[] };

const RECIPES: Record<HapticEvent, Recipe> = {
  lightTap: { kind: "impact", style: "LIGHT", web: 12 },
  mediumTap: { kind: "impact", style: "MEDIUM", web: 20 },
  heavyTap: { kind: "impact", style: "HEAVY", web: 32 },
  success: { kind: "notification", style: "SUCCESS", web: [14, 40, 14] },
  warning: { kind: "notification", style: "WARNING", web: [20, 60, 20] },
  error: { kind: "notification", style: "ERROR", web: [60, 50, 140] },
  goldReward: { kind: "notification", style: "SUCCESS", web: [14, 40, 14] },
  purpleFirstTap: { kind: "impact", style: "LIGHT", web: 8 },
  purpleComplete: { kind: "notification", style: "SUCCESS", web: [14, 40, 14] },
  comboMilestone: { kind: "impact", style: "MEDIUM", web: [20, 40, 20] },
  levelUp: { kind: "notification", style: "SUCCESS", web: [16, 40, 16, 40, 30] },
  gameOver: { kind: "notification", style: "ERROR", web: [60, 50, 140] },
};

/** Rapid gameplay must never queue a stream of heavy feedback. */
const MIN_INTERVAL_MS = 40;

let enabled = true;
let lastFiredAt = 0;
let plugin: HapticsPlugin | null = null;
let pluginRequested = false;

export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

export function hapticsEnabled(): boolean {
  return enabled;
}

function loadPlugin() {
  if (pluginRequested) return;
  pluginRequested = true;
  if (!isNativePlatform() || !isPluginAvailable("Haptics")) return;
  void import("@capacitor/haptics")
    .then((mod) => {
      plugin = mod.Haptics as unknown as HapticsPlugin;
    })
    .catch(() => {
      plugin = null;
    });
}

/** Warm up the native plugin once, after the app knows it is running natively. */
export function primeHaptics() {
  loadPlugin();
}

function webVibrate(pattern: number | number[]) {
  try {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    navigator.vibrate(pattern);
  } catch {
    /* unsupported — fail silently */
  }
}

export function haptic(event: HapticEvent) {
  if (!enabled) return;
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - lastFiredAt < MIN_INTERVAL_MS) return;
  lastFiredAt = now;

  const recipe = RECIPES[event];
  loadPlugin();

  if (plugin) {
    try {
      const promise =
        recipe.kind === "impact"
          ? plugin.impact({ style: recipe.style })
          : plugin.notification({ type: recipe.style });
      void promise.catch(() => {});
      return;
    } catch {
      /* fall through to the browser path */
    }
  }

  if (!isNativePlatform()) webVibrate(recipe.web);
}
