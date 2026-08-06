/**
 * Phase 2 — daily missions.
 *
 * Three missions are generated deterministically from the local calendar date,
 * so the same device shows the same set all day and rolls over exactly once at
 * midnight. Progress is accumulated locally; XP is only paid when the player
 * claims a completed mission, and the claim is idempotent.
 */

import { localDateString, isValidDateString, seededRandom } from "./daily";
import { STORAGE_VERSION } from "./progressionTypes";
import type { GameSessionResult, StorageVersion } from "./progressionTypes";

export type MissionCategory = "score" | "precision" | "combo" | "targets" | "volume" | "speed";

export type MissionMetric =
  | "score"
  | "correct"
  | "perfect"
  | "great"
  | "closeCalls"
  | "combo"
  | "gold"
  | "traps"
  | "purple"
  | "games"
  | "avgReaction";

export type MissionTier = "easy" | "medium" | "hard";

export const MISSION_TIER_XP: Record<MissionTier, number> = {
  easy: 60,
  medium: 120,
  hard: 200,
};

export interface DailyMission {
  id: string;
  templateId: string;
  category: MissionCategory;
  tier: MissionTier;
  label: string;
  metric: MissionMetric;
  target: number;
  /** "sum" accumulates across runs, "best" keeps the best single run */
  accumulate: "sum" | "best";
  lowerIsBetter: boolean;
  rewardXp: number;
}

export interface MissionProgress {
  value: number;
  completed: boolean;
  claimed: boolean;
}

export interface DailyMissionsState {
  version: StorageVersion;
  date: string;
  missions: DailyMission[];
  progress: Record<string, MissionProgress>;
  /** lifetime counters, never reset by the daily rollover */
  lifetimeCompleted: number;
  lifetimeClaimedXp: number;
}

interface MissionTemplate {
  id: string;
  category: MissionCategory;
  metric: MissionMetric;
  accumulate: "sum" | "best";
  lowerIsBetter?: boolean;
  label: (target: number) => string;
  targets: Record<MissionTier, number[]>;
}

export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    id: "daily-score",
    category: "score",
    metric: "score",
    accumulate: "best",
    label: (t) => `Score ${t} points in a single run`,
    targets: { easy: [10, 12], medium: [20, 25], hard: [35, 45] },
  },
  {
    id: "daily-total-taps",
    category: "volume",
    metric: "correct",
    accumulate: "sum",
    label: (t) => `Land ${t} successful taps today`,
    targets: { easy: [25, 30], medium: [60, 75], hard: [120, 150] },
  },
  {
    id: "daily-perfect",
    category: "precision",
    metric: "perfect",
    accumulate: "sum",
    label: (t) => `Land ${t} PERFECT taps today`,
    targets: { easy: [5, 8], medium: [15, 20], hard: [35, 45] },
  },
  {
    id: "daily-great",
    category: "precision",
    metric: "great",
    accumulate: "sum",
    label: (t) => `Land ${t} GREAT-timed taps today`,
    targets: { easy: [8, 10], medium: [20, 25], hard: [40, 50] },
  },
  {
    id: "daily-close-calls",
    category: "precision",
    metric: "closeCalls",
    accumulate: "sum",
    label: (t) => `Survive ${t} close calls`,
    targets: { easy: [2, 3], medium: [6, 8], hard: [12, 15] },
  },
  {
    id: "daily-combo",
    category: "combo",
    metric: "combo",
    accumulate: "best",
    label: (t) => `Reach a combo of ${t}`,
    targets: { easy: [5, 6], medium: [10, 12], hard: [18, 22] },
  },
  {
    id: "daily-gold",
    category: "targets",
    metric: "gold",
    accumulate: "sum",
    label: (t) => `Collect ${t} gold targets today`,
    targets: { easy: [3, 4], medium: [8, 10], hard: [18, 22] },
  },
  {
    id: "daily-traps",
    category: "targets",
    metric: "traps",
    accumulate: "sum",
    label: (t) => `Avoid ${t} red traps today`,
    targets: { easy: [5, 6], medium: [12, 15], hard: [25, 30] },
  },
  {
    id: "daily-purple",
    category: "targets",
    metric: "purple",
    accumulate: "sum",
    label: (t) => `Complete ${t} purple double-taps today`,
    targets: { easy: [3, 4], medium: [8, 10], hard: [18, 22] },
  },
  {
    id: "daily-games",
    category: "volume",
    metric: "games",
    accumulate: "sum",
    label: (t) => `Play ${t} runs today`,
    targets: { easy: [2, 3], medium: [5, 6], hard: [10, 12] },
  },
  {
    id: "daily-average",
    category: "speed",
    metric: "avgReaction",
    accumulate: "best",
    lowerIsBetter: true,
    label: (t) => `Finish a run averaging under ${t}ms`,
    targets: { easy: [520, 500], medium: [450, 430], hard: [380, 360] },
  },
];

const TIER_ORDER: MissionTier[] = ["easy", "medium", "hard"];

function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length) % items.length];
}

/** Deterministic per-date set: one easy, one medium and one hard mission. */
export function generateDailyMissions(date = localDateString()): DailyMission[] {
  const safeDate = isValidDateString(date) ? date : localDateString();
  const rand = seededRandom(`missions:${safeDate}`);
  const pool = [...MISSION_TEMPLATES];
  const missions: DailyMission[] = [];
  const usedCategories = new Set<MissionCategory>();

  for (const tier of TIER_ORDER) {
    const candidates = pool.filter((t) => !usedCategories.has(t.category));
    const template = pick(rand, candidates.length > 0 ? candidates : pool);
    usedCategories.add(template.category);
    pool.splice(pool.indexOf(template), 1);
    const target = pick(rand, template.targets[tier]);
    missions.push({
      id: `${safeDate}:${template.id}:${tier}:${target}`,
      templateId: template.id,
      category: template.category,
      tier,
      label: template.label(target),
      metric: template.metric,
      target,
      accumulate: template.accumulate,
      lowerIsBetter: template.lowerIsBetter ?? false,
      rewardXp: MISSION_TIER_XP[tier],
    });
  }
  return missions;
}

export function emptyMissionProgress(missions: DailyMission[]): Record<string, MissionProgress> {
  const progress: Record<string, MissionProgress> = {};
  for (const m of missions) {
    progress[m.id] = { value: m.lowerIsBetter ? 0 : 0, completed: false, claimed: false };
  }
  return progress;
}

export function defaultMissionsState(date = localDateString()): DailyMissionsState {
  const missions = generateDailyMissions(date);
  return {
    version: STORAGE_VERSION,
    date: isValidDateString(date) ? date : localDateString(),
    missions,
    progress: emptyMissionProgress(missions),
    lifetimeCompleted: 0,
    lifetimeClaimedXp: 0,
  };
}

/** Rolls the set over when the local date changed. Lifetime counters survive. */
export function rolloverMissions(
  state: DailyMissionsState,
  date = localDateString(),
): DailyMissionsState {
  const today = isValidDateString(date) ? date : localDateString();
  if (state.date === today && state.missions.length === 3) return state;
  const missions = generateDailyMissions(today);
  return {
    ...state,
    version: STORAGE_VERSION,
    date: today,
    missions,
    progress: emptyMissionProgress(missions),
  };
}

/** Value a finished run contributes, or null when the mission does not apply. */
export function missionValueFromRun(
  mission: DailyMission,
  result: GameSessionResult,
): number | null {
  const s = result.stats;
  switch (mission.metric) {
    case "score":
      return result.score;
    case "correct":
      return s.successes;
    case "perfect":
      return s.perfect;
    case "great":
      return s.great ?? 0;
    case "closeCalls":
      return s.closeCalls ?? 0;
    case "combo":
      return result.bestCombo;
    case "gold":
      return s.gold;
    case "traps":
      return s.trapsAvoided;
    case "purple":
      return s.purpleCompletions;
    case "games":
      return 1;
    case "avgReaction":
      return s.successes >= 5 && s.avgReaction !== null ? s.avgReaction : null;
    default:
      return null;
  }
}

export function mergeMissionValue(
  mission: DailyMission,
  previous: number,
  next: number,
): number {
  if (!Number.isFinite(next) || next < 0) return previous;
  if (mission.accumulate === "sum") return previous + next;
  if (mission.lowerIsBetter) return previous <= 0 ? next : Math.min(previous, next);
  return Math.max(previous, next);
}

export function isMissionMet(mission: DailyMission, value: number): boolean {
  if (!Number.isFinite(value)) return false;
  if (mission.lowerIsBetter) return value > 0 && value <= mission.target;
  return value >= mission.target;
}

export interface MissionRunOutcome {
  state: DailyMissionsState;
  /** missions that reached their target during this run */
  completed: DailyMission[];
  /** missions whose progress moved this run */
  advanced: { mission: DailyMission; value: number }[];
}

/** Pure: folds one finished run into the mission state. Never grants XP. */
export function applyRunToMissions(
  state: DailyMissionsState,
  result: GameSessionResult,
  date = localDateString(),
): MissionRunOutcome {
  const rolled = rolloverMissions(state, date);
  const progress: Record<string, MissionProgress> = { ...rolled.progress };
  const completed: DailyMission[] = [];
  const advanced: { mission: DailyMission; value: number }[] = [];
  let lifetimeCompleted = rolled.lifetimeCompleted;

  for (const mission of rolled.missions) {
    const current = progress[mission.id] ?? { value: 0, completed: false, claimed: false };
    if (current.completed) {
      progress[mission.id] = current;
      continue;
    }
    const runValue = missionValueFromRun(mission, result);
    if (runValue === null) {
      progress[mission.id] = current;
      continue;
    }
    const value = mergeMissionValue(mission, current.value, runValue);
    const done = isMissionMet(mission, value);
    if (value !== current.value) advanced.push({ mission, value });
    if (done && !current.completed) {
      completed.push(mission);
      lifetimeCompleted += 1;
    }
    progress[mission.id] = { value, completed: done, claimed: current.claimed };
  }

  return {
    state: { ...rolled, progress, lifetimeCompleted },
    completed,
    advanced,
  };
}

export interface MissionClaimResult {
  state: DailyMissionsState;
  xp: number;
}

/** Idempotent: claiming twice pays exactly once. */
export function claimMission(state: DailyMissionsState, missionId: string): MissionClaimResult {
  const mission = state.missions.find((m) => m.id === missionId);
  const current = mission ? state.progress[mission.id] : undefined;
  if (!mission || !current || !current.completed || current.claimed) {
    return { state, xp: 0 };
  }
  return {
    state: {
      ...state,
      progress: { ...state.progress, [mission.id]: { ...current, claimed: true } },
      lifetimeClaimedXp: state.lifetimeClaimedXp + mission.rewardXp,
    },
    xp: mission.rewardXp,
  };
}

export function claimableMissionCount(state: DailyMissionsState): number {
  return state.missions.filter((m) => {
    const p = state.progress[m.id];
    return p?.completed === true && p.claimed !== true;
  }).length;
}

export function missionRatio(mission: DailyMission, value: number): number {
  if (mission.lowerIsBetter) {
    if (value <= 0) return 0;
    return Math.max(0, Math.min(1, mission.target / value));
  }
  return Math.max(0, Math.min(1, mission.target > 0 ? value / mission.target : 0));
}

export const MISSION_TIER_LABEL: Record<MissionTier, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};
