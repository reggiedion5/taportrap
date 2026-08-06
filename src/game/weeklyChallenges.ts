/**
 * Weekly challenges.
 *
 * Three challenges (accessible / medium / challenging) are generated
 * deterministically from a Monday-anchored local week key. Progress is folded
 * in from completed runs; XP is only paid when the player claims, and a claim
 * from a previous week is refused.
 */

import { isValidDateString, localDateString, seededRandom } from "./daily";
import type {
  WeeklyCategory,
  WeeklyChallenge,
  WeeklyState,
  WeeklyTier,
} from "./phase3Types";

export const WEEKLY_TIER_XP: Record<WeeklyTier, number> = {
  accessible: 200,
  medium: 400,
  challenging: 750,
};

export const WEEKLY_TIER_LABEL: Record<WeeklyTier, string> = {
  accessible: "Accessible",
  medium: "Medium",
  challenging: "Challenging",
};

/** Monday-anchored key, e.g. `2026-08-03`. Local dates only — never UTC. */
export function weekKeyFor(date = new Date()): string {
  const d = Number.isNaN(date.getTime()) ? new Date() : new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  // JS weeks start on Sunday: shift so Monday === 0.
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return localDateString(d);
}

export function weekKeyForDate(date: string): string {
  if (!isValidDateString(date)) return weekKeyFor();
  return weekKeyFor(new Date(`${date}T00:00:00`));
}

interface WeeklyTemplate {
  type: WeeklyCategory;
  title: string;
  description: (target: number) => string;
  /** distinct-value challenges accumulate a set instead of a number */
  set?: boolean;
  targets: Record<WeeklyTier, number[]>;
}

export const WEEKLY_TEMPLATES: WeeklyTemplate[] = [
  {
    type: "totalScore",
    title: "Point Machine",
    description: (t) => `Earn ${t} total score this week`,
    targets: { accessible: [400, 500], medium: [1000, 1200], challenging: [2500, 3000] },
  },
  {
    type: "games",
    title: "Regular Player",
    description: (t) => `Complete ${t} games this week`,
    targets: { accessible: [8, 10], medium: [25, 30], challenging: [50, 60] },
  },
  {
    type: "correct",
    title: "Tap Marathon",
    description: (t) => `Land ${t} correct taps this week`,
    targets: { accessible: [150, 200], medium: [500, 600], challenging: [1200, 1500] },
  },
  {
    type: "perfect",
    title: "Precision Week",
    description: (t) => `Land ${t} PERFECT taps this week`,
    targets: { accessible: [15, 20], medium: [50, 60], challenging: [120, 150] },
  },
  {
    type: "closeCalls",
    title: "Living Dangerously",
    description: (t) => `Trigger ${t} close calls this week`,
    targets: { accessible: [6, 8], medium: [20, 25], challenging: [45, 55] },
  },
  {
    type: "combo",
    title: "Chain Reaction",
    description: (t) => `Reach a combo of ${t}`,
    targets: { accessible: [12, 15], medium: [25, 28], challenging: [35, 40] },
  },
  {
    type: "xp",
    title: "Level Grinder",
    description: (t) => `Earn ${t} XP this week`,
    targets: { accessible: [400, 500], medium: [1500, 1800], challenging: [3500, 4000] },
  },
  {
    type: "dailyMissions",
    title: "Mission Control",
    description: (t) => `Complete ${t} daily missions this week`,
    targets: { accessible: [3, 4], medium: [10, 12], challenging: [18, 21] },
  },
  {
    type: "difficulties",
    title: "All Rounder",
    description: (t) => `Play ${t} different difficulties`,
    set: true,
    targets: { accessible: [2, 2], medium: [3, 3], challenging: [3, 3] },
  },
  {
    type: "boards",
    title: "Scenery Change",
    description: (t) => `Play on ${t} different boards`,
    set: true,
    targets: { accessible: [2, 3], medium: [5, 5], challenging: [8, 8] },
  },
];

const TIERS: WeeklyTier[] = ["accessible", "medium", "challenging"];

function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length) % items.length];
}

export function generateWeeklyChallenges(weekKey: string): WeeklyChallenge[] {
  const key = isValidDateString(weekKey) ? weekKey : weekKeyFor();
  const rand = seededRandom(`weekly:${key}`);
  const pool = [...WEEKLY_TEMPLATES];
  const out: WeeklyChallenge[] = [];

  for (const tier of TIERS) {
    const template = pick(rand, pool);
    pool.splice(pool.indexOf(template), 1);
    const target = pick(rand, template.targets[tier]);
    out.push({
      id: `${key}:${template.type}:${tier}`,
      weekKey: key,
      type: template.type,
      tier,
      title: template.title,
      description: template.description(target),
      target,
      progress: 0,
      rewardXp: WEEKLY_TIER_XP[tier],
      completed: false,
      claimed: false,
      completedAt: null,
      claimedAt: null,
      tracked: template.set ? [] : undefined,
    });
  }
  return out;
}

export function defaultWeeklyState(weekKey = weekKeyFor()): WeeklyState {
  return {
    weekKey,
    challenges: generateWeeklyChallenges(weekKey),
    lifetimeCompleted: 0,
  };
}

/** Rolls to a new week exactly once; lifetime counters survive. */
export function rolloverWeekly(state: WeeklyState, weekKey = weekKeyFor()): WeeklyState {
  if (state.weekKey === weekKey && state.challenges.length === TIERS.length) return state;
  return {
    ...state,
    weekKey,
    challenges: generateWeeklyChallenges(weekKey),
  };
}

export interface WeeklyRunInput {
  score: number;
  correct: number;
  perfect: number;
  closeCalls: number;
  bestCombo: number;
  xpEarned: number;
  dailyMissionsCompleted: number;
  difficulty: string;
  boardId: string;
}

export interface WeeklyRunOutcome {
  state: WeeklyState;
  completed: WeeklyChallenge[];
}

function nextProgress(challenge: WeeklyChallenge, input: WeeklyRunInput): number {
  switch (challenge.type) {
    case "totalScore":
      return challenge.progress + Math.max(0, input.score);
    case "games":
      return challenge.progress + 1;
    case "correct":
      return challenge.progress + Math.max(0, input.correct);
    case "perfect":
      return challenge.progress + Math.max(0, input.perfect);
    case "closeCalls":
      return challenge.progress + Math.max(0, input.closeCalls);
    case "xp":
      return challenge.progress + Math.max(0, input.xpEarned);
    case "dailyMissions":
      return challenge.progress + Math.max(0, input.dailyMissionsCompleted);
    case "combo":
      return Math.max(challenge.progress, Math.max(0, input.bestCombo));
    default:
      return challenge.progress;
  }
}

/** Pure: folds one completed run into the weekly set. Never grants XP. */
export function applyRunToWeekly(
  state: WeeklyState,
  input: WeeklyRunInput,
  weekKey = weekKeyFor(),
): WeeklyRunOutcome {
  const rolled = rolloverWeekly(state, weekKey);
  const completed: WeeklyChallenge[] = [];
  const now = Date.now();

  const challenges = rolled.challenges.map((challenge) => {
    if (challenge.completed) return challenge;

    let tracked = challenge.tracked;
    let progress = challenge.progress;

    if (challenge.type === "difficulties" || challenge.type === "boards") {
      const value = challenge.type === "difficulties" ? input.difficulty : input.boardId;
      const set = new Set(tracked ?? []);
      if (value) set.add(value);
      tracked = Array.from(set);
      progress = tracked.length;
    } else {
      progress = nextProgress(challenge, input);
    }

    const done = progress >= challenge.target;
    const next: WeeklyChallenge = {
      ...challenge,
      progress,
      tracked,
      completed: done,
      completedAt: done ? now : null,
    };
    if (done) completed.push(next);
    return next;
  });

  return {
    state: {
      ...rolled,
      challenges,
      lifetimeCompleted: rolled.lifetimeCompleted + completed.length,
    },
    completed,
  };
}

export interface WeeklyClaimResult {
  state: WeeklyState;
  xp: number;
}

/** Idempotent, and refuses challenges belonging to an earlier week. */
export function claimWeekly(
  state: WeeklyState,
  challengeId: string,
  weekKey = weekKeyFor(),
): WeeklyClaimResult {
  const challenge = state.challenges.find((c) => c.id === challengeId);
  if (
    !challenge ||
    challenge.weekKey !== weekKey ||
    state.weekKey !== weekKey ||
    !challenge.completed ||
    challenge.claimed
  ) {
    return { state, xp: 0 };
  }
  return {
    state: {
      ...state,
      challenges: state.challenges.map((c) =>
        c.id === challengeId ? { ...c, claimed: true, claimedAt: Date.now() } : c,
      ),
    },
    xp: challenge.rewardXp,
  };
}

export function claimableWeeklyCount(state: WeeklyState): number {
  return state.challenges.filter((c) => c.completed && !c.claimed).length;
}

export function weeklyRatio(challenge: WeeklyChallenge): number {
  if (challenge.target <= 0) return 0;
  return Math.max(0, Math.min(1, challenge.progress / challenge.target));
}
