/**
 * Consecutive-day play streak.
 *
 * A qualifying day is any local calendar date with at least one completed run.
 * Everything is computed from `YYYY-MM-DD` local date strings so a timezone
 * change or an app refresh can never double-count a day.
 */

import { dayDifference, isValidDateString, localDateString } from "./daily";
import type { PlayStreakState } from "./phase3Types";

export const STREAK_MILESTONES: { days: number; xp: number; badgeId: string | null }[] = [
  { days: 3, xp: 75, badgeId: null },
  { days: 7, xp: 150, badgeId: "streak-7" },
  { days: 14, xp: 250, badgeId: null },
  { days: 30, xp: 500, badgeId: "streak-30" },
  { days: 50, xp: 750, badgeId: null },
  { days: 100, xp: 1500, badgeId: "streak-100" },
];

export function defaultStreak(): PlayStreakState {
  return {
    current: 0,
    longest: 0,
    lastQualifiedDate: null,
    uniquePlayDates: 0,
    grantedMilestones: [],
  };
}

export interface StreakOutcome {
  state: PlayStreakState;
  /** true when this call moved the streak to a new day */
  advanced: boolean;
  /** milestones reached for the first time (rewards not yet applied) */
  milestones: typeof STREAK_MILESTONES;
}

/** Registers one completed run on `date`. Idempotent within the same day. */
export function registerPlayDay(state: PlayStreakState, date = localDateString()): StreakOutcome {
  const today = isValidDateString(date) ? date : localDateString();
  const last = isValidDateString(state.lastQualifiedDate) ? state.lastQualifiedDate : null;

  if (last === today) {
    return { state, advanced: false, milestones: [] };
  }

  const gap = last ? dayDifference(last, today) : null;
  // A negative gap means the device clock moved backwards — keep the streak
  // where it is rather than corrupting it.
  let current: number;
  if (gap === 1) current = Math.max(1, state.current) + 1;
  else if (gap !== null && gap <= 0) current = Math.max(1, state.current);
  else current = 1;

  const longest = Math.max(state.longest, current);
  const milestones = STREAK_MILESTONES.filter(
    (m) => current >= m.days && !state.grantedMilestones.includes(m.days),
  );

  const next: PlayStreakState = {
    current,
    longest,
    lastQualifiedDate: today,
    uniquePlayDates: state.uniquePlayDates + 1,
    grantedMilestones: [...state.grantedMilestones, ...milestones.map((m) => m.days)],
  };

  return { state: next, advanced: true, milestones };
}

/** Read-only view used by the profile: a stale streak shows as broken. */
export function displayedStreak(state: PlayStreakState, date = localDateString()): number {
  const last = isValidDateString(state.lastQualifiedDate) ? state.lastQualifiedDate : null;
  if (!last) return 0;
  const gap = dayDifference(last, date);
  if (gap === null) return state.current;
  return gap <= 1 ? state.current : 0;
}
