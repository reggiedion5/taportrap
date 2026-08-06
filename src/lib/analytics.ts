/**
 * Safe analytics architecture — no vendor, no network, no identifiers.
 *
 * Every call site uses this one interface so a vendor can be added later in a
 * single place. Analytics are disabled by default: with no sink configured the
 * calls are inert. Nothing here may ever collect personal data, device ids,
 * advertising ids or location, and gameplay never depends on it.
 */

import { isFeatureEnabled } from "@/config/gameFeatures";
import { IS_DEV } from "./appConfig";

export type AnalyticsEventName =
  | "app_open"
  | "onboarding_started"
  | "onboarding_completed"
  | "tutorial_started"
  | "tutorial_completed"
  | "practice_started"
  | "game_started"
  | "game_completed"
  | "game_abandoned"
  | "difficulty_selected"
  | "board_equipped"
  | "mission_completed"
  | "achievement_unlocked"
  | "level_reached"
  | "share_started"
  | "share_completed"
  | "settings_changed";

/** Only non-identifying primitives may be attached to an event. */
export type AnalyticsPayload = Record<string, string | number | boolean>;

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  payload: AnalyticsPayload;
  /** Milliseconds since epoch — coarse, never a device clock fingerprint. */
  at: number;
}

export type AnalyticsSink = (event: AnalyticsEvent) => void;

/** No vendor is configured for release, so analytics stay off. */
let sink: AnalyticsSink | null = null;

const recent: AnalyticsEvent[] = [];
const RECENT_CAP = 50;

export function analyticsEnabled(): boolean {
  return isFeatureEnabled("safeAnalytics") && sink !== null;
}

/**
 * Registers the single delivery sink. Intentionally unused in this release —
 * kept so a future vendor integration never has to touch component code.
 */
export function configureAnalytics(next: AnalyticsSink | null): void {
  sink = next;
}

export function trackEvent(name: AnalyticsEventName, payload: AnalyticsPayload = {}): void {
  const event: AnalyticsEvent = { name, payload, at: Date.now() };
  // Local dev ring buffer only — never persisted, never transmitted.
  if (IS_DEV) {
    recent.push(event);
    if (recent.length > RECENT_CAP) recent.shift();
  }
  if (!analyticsEnabled()) return;
  try {
    sink?.(event);
  } catch {
    /* analytics must never break gameplay */
  }
}

/** Dev-only inspection helper for the Release QA screen. */
export function recentAnalyticsEvents(): AnalyticsEvent[] {
  return IS_DEV ? [...recent] : [];
}
