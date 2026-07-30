import type { GameMode } from "./modes";
import type {
  DailyChallenge,
  DailyChallengeType,
  DailyState,
  GameSessionResult,
} from "./progressionTypes";

export const DAILY_XP_REWARD = 150;

/* ---------------- local date helpers ---------------- */

export function localDateString(date = new Date()): string {
  const d = Number.isNaN(date.getTime()) ? new Date() : date;
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const t = Date.parse(`${value}T00:00:00`);
  return Number.isFinite(t);
}

export function dayDifference(from: string, to: string): number | null {
  if (!isValidDateString(from) || !isValidDateString(to)) return null;
  const a = Date.parse(`${from}T00:00:00`);
  const b = Date.parse(`${to}T00:00:00`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) / 86_400_000);
}

/* ---------------- seeded deterministic challenge ---------------- */

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — deterministic PRNG seeded from the date string */
export function seededRandom(seed: string): () => number {
  let a = hashString(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ChallengeTemplate {
  type: DailyChallengeType;
  mode: GameMode | null;
  targets: number[];
  objective: (target: number) => string;
  lowerIsBetter?: boolean;
}

const TEMPLATES: ChallengeTemplate[] = [
  {
    type: "classic-score",
    mode: "classic",
    targets: [15, 20, 25, 30],
    objective: (t) => `Score ${t} points in Classic`,
  },
  {
    type: "traps-avoided",
    mode: null,
    targets: [6, 8, 10],
    objective: (t) => `Avoid ${t} red traps in one run`,
  },
  {
    type: "purple-complete",
    mode: null,
    targets: [4, 6, 8],
    objective: (t) => `Complete ${t} purple targets in one run`,
  },
  {
    type: "gold-collect",
    mode: null,
    targets: [3, 5, 7],
    objective: (t) => `Collect ${t} gold targets in one run`,
  },
  {
    type: "combo-reach",
    mode: null,
    targets: [8, 10, 14],
    objective: (t) => `Reach a combo of ${t}`,
  },
  {
    type: "perfect-count",
    mode: null,
    targets: [4, 5, 7],
    objective: (t) => `Get ${t} PERFECT reactions in one run`,
  },
  {
    type: "blitz-score",
    mode: "blitz",
    targets: [25, 30, 40],
    objective: (t) => `Score ${t} points in Blitz`,
  },
  {
    type: "survival-reactions",
    mode: "survival",
    targets: [20, 25, 30],
    objective: (t) => `Land ${t} successful reactions in Survival`,
  },
  {
    type: "focus-average",
    mode: "focus",
    targets: [400, 420],
    objective: (t) => `Average under ${t}ms in Focus`,
    lowerIsBetter: true,
  },
  {
    type: "multiplier-reach",
    mode: null,
    targets: [3, 4],
    objective: (t) => `Reach a ${t}x multiplier`,
  },
];

export function generateDailyChallenge(date: string): DailyChallenge {
  const safeDate = isValidDateString(date) ? date : localDateString();
  const rand = seededRandom(safeDate);
  const template = TEMPLATES[Math.floor(rand() * TEMPLATES.length)];
  const target = template.targets[Math.floor(rand() * template.targets.length)];
  return {
    id: `${safeDate}:${template.type}:${target}`,
    date: safeDate,
    type: template.type,
    objective: template.objective(target),
    target,
    mode: template.mode,
    lowerIsBetter: template.lowerIsBetter ?? false,
  };
}

/** Value this run contributes to the challenge, or null when it does not apply. */
export function challengeRunValue(
  challenge: DailyChallenge,
  result: GameSessionResult,
): number | null {
  const { stats } = result;
  switch (challenge.type) {
    case "classic-score":
      return result.mode === "classic" ? result.score : null;
    case "blitz-score":
      return result.mode === "blitz" ? result.score : null;
    case "survival-reactions":
      return result.mode === "survival" ? stats.successes : null;
    case "focus-average":
      return result.mode === "focus" && stats.avgReaction !== null && stats.successes >= 5
        ? stats.avgReaction
        : null;
    case "traps-avoided":
      return stats.trapsAvoided;
    case "purple-complete":
      return stats.purpleCompletions;
    case "gold-collect":
      return stats.gold;
    case "combo-reach":
      return result.bestCombo;
    case "perfect-count":
      return stats.perfect;
    case "multiplier-reach":
      return result.bestMultiplier;
    default:
      return null;
  }
}

export function isChallengeMet(challenge: DailyChallenge, value: number): boolean {
  if (!Number.isFinite(value)) return false;
  return challenge.lowerIsBetter ? value <= challenge.target : value >= challenge.target;
}

/** Merge a new run value into stored progress (best-so-far semantics). */
export function mergeChallengeProgress(
  challenge: DailyChallenge,
  previous: number,
  next: number,
): number {
  if (!Number.isFinite(next)) return previous;
  if (challenge.lowerIsBetter) {
    if (previous <= 0) return next;
    return Math.min(previous, next);
  }
  return Math.max(previous, next);
}

/** Streak update applied exactly once, when a challenge is completed. */
export function advanceStreak(state: DailyState, date: string): DailyState {
  if (state.lastCompletedDate === date) return state;
  const gap = state.lastCompletedDate ? dayDifference(state.lastCompletedDate, date) : null;
  const current = gap === 1 ? Math.max(1, state.currentStreak) + 1 : 1;
  return {
    ...state,
    currentStreak: current,
    bestStreak: Math.max(state.bestStreak, current),
    lastCompletedDate: date,
    totalCompleted: state.totalCompleted + 1,
  };
}

/** Streak decays when the player misses a day; never goes negative. */
export function normalizeStreak(state: DailyState, today: string): DailyState {
  if (!state.lastCompletedDate) {
    return { ...state, currentStreak: Math.max(0, state.currentStreak) };
  }
  const gap = dayDifference(state.lastCompletedDate, today);
  if (gap === null || gap < 0) {
    return { ...state, currentStreak: 0, lastCompletedDate: null };
  }
  if (gap > 1) return { ...state, currentStreak: 0 };
  return { ...state, currentStreak: Math.max(1, state.currentStreak) };
}
