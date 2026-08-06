/**
 * Seven-day daily login cycle.
 *
 * The reward is never granted automatically: opening the app on a new local
 * date makes it claimable, and claiming is idempotent per date.
 */

import { isValidDateString, localDateString } from "./daily";
import type { LoginRewardState } from "./phase3Types";

export interface LoginRewardDay {
  day: number;
  xp: number;
  badgeId: string | null;
}

export const LOGIN_CYCLE: LoginRewardDay[] = [
  { day: 1, xp: 50, badgeId: null },
  { day: 2, xp: 75, badgeId: null },
  { day: 3, xp: 100, badgeId: null },
  { day: 4, xp: 125, badgeId: null },
  { day: 5, xp: 150, badgeId: null },
  { day: 6, xp: 200, badgeId: null },
  { day: 7, xp: 300, badgeId: "login-7" },
];

export function defaultLoginState(): LoginRewardState {
  return { cycleDay: 1, lastClaimDate: null, totalClaimed: 0, completedCycles: 0 };
}

export function safeCycleDay(value: number): number {
  const day = Math.floor(Number.isFinite(value) ? value : 1);
  if (day < 1 || day > LOGIN_CYCLE.length) return 1;
  return day;
}

export function loginRewardAvailable(
  state: LoginRewardState,
  date = localDateString(),
): boolean {
  const today = isValidDateString(date) ? date : localDateString();
  return state.lastClaimDate !== today;
}

export function currentLoginDay(state: LoginRewardState): LoginRewardDay {
  return LOGIN_CYCLE[safeCycleDay(state.cycleDay) - 1];
}

export interface LoginClaimResult {
  state: LoginRewardState;
  xp: number;
  badgeId: string | null;
  /** true when the claim completed a full seven-day cycle */
  cycleCompleted: boolean;
}

/** Claims today's login reward. A second call on the same date pays nothing. */
export function claimLoginReward(
  state: LoginRewardState,
  date = localDateString(),
): LoginClaimResult {
  const today = isValidDateString(date) ? date : localDateString();
  if (!loginRewardAvailable(state, today)) {
    return { state, xp: 0, badgeId: null, cycleCompleted: false };
  }
  const day = currentLoginDay(state);
  const cycleCompleted = day.day === LOGIN_CYCLE.length;
  return {
    state: {
      cycleDay: cycleCompleted ? 1 : day.day + 1,
      lastClaimDate: today,
      totalClaimed: state.totalClaimed + 1,
      completedCycles: state.completedCycles + (cycleCompleted ? 1 : 0),
    },
    xp: day.xp,
    badgeId: day.badgeId,
    cycleCompleted,
  };
}
