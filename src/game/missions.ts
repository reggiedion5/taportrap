import { MODE_CONFIG, type GameMode } from "./modes";
import type { GameSessionResult, PostGameMission } from "./progressionTypes";

const MAX_ATTEMPTS = 4;

interface Candidate {
  metric: PostGameMission["metric"];
  label: (t: number) => string;
  target: (result: GameSessionResult) => number;
  lowerIsBetter?: boolean;
  allows?: (mode: GameMode) => boolean;
}

const CANDIDATES: Candidate[] = [
  {
    metric: "score",
    label: (t) => `Beat your score — reach ${t}`,
    target: (r) => Math.max(5, r.score + 5),
  },
  {
    metric: "combo",
    label: (t) => `Reach a ${t} combo`,
    target: (r) => Math.max(5, Math.min(r.bestCombo + 3, 20)),
  },
  {
    metric: "perfect",
    label: (t) => `Land ${t} PERFECT reactions`,
    target: (r) => Math.max(3, r.stats.perfect + 1),
  },
  {
    metric: "traps",
    label: (t) => `Avoid ${t} red traps`,
    target: (r) => Math.max(3, r.stats.trapsAvoided + 1),
    allows: (mode) => MODE_CONFIG[mode].colors.includes("red"),
  },
  {
    metric: "gold",
    label: (t) => `Collect ${t} gold targets`,
    target: (r) => Math.max(2, r.stats.gold + 1),
  },
  {
    metric: "purple",
    label: (t) => `Complete ${t} purple targets`,
    target: (r) => Math.max(2, r.stats.purpleCompletions + 1),
    allows: (mode) => MODE_CONFIG[mode].colors.includes("purple"),
  },
  {
    metric: "successes",
    label: (t) => `Land ${t} successful reactions`,
    target: (r) => Math.max(10, r.stats.successes + 3),
    allows: (mode) => mode === "survival",
  },
  {
    metric: "avgReaction",
    label: (t) => `Average under ${t}ms`,
    target: (r) =>
      r.stats.avgReaction !== null
        ? Math.max(280, Math.round((r.stats.avgReaction - 20) / 10) * 10)
        : 450,
    lowerIsBetter: true,
    allows: (mode) => mode === "focus",
  },
];

export function generatePostGameMission(result: GameSessionResult): PostGameMission {
  const pool = CANDIDATES.filter((c) => !c.allows || c.allows(result.mode));
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const target = Math.max(1, Math.round(pick.target(result)));
  return {
    id: `${result.mode}:${pick.metric}:${target}`,
    mode: result.mode,
    label: pick.label(target),
    target,
    metric: pick.metric,
    lowerIsBetter: pick.lowerIsBetter ?? false,
    attempts: 0,
  };
}

export function missionRunValue(
  mission: PostGameMission,
  result: GameSessionResult,
): number | null {
  if (mission.mode !== result.mode) return null;
  switch (mission.metric) {
    case "score":
      return result.score;
    case "combo":
      return result.bestCombo;
    case "perfect":
      return result.stats.perfect;
    case "traps":
      return result.stats.trapsAvoided;
    case "gold":
      return result.stats.gold;
    case "purple":
      return result.stats.purpleCompletions;
    case "successes":
      return result.stats.successes;
    case "avgReaction":
      return result.stats.successes >= 5 ? result.stats.avgReaction : null;
    default:
      return null;
  }
}

export function isMissionComplete(mission: PostGameMission, value: number | null): boolean {
  if (value === null || !Number.isFinite(value)) return false;
  return mission.lowerIsBetter ? value <= mission.target : value >= mission.target;
}

export function shouldReplaceMission(mission: PostGameMission): boolean {
  return mission.attempts >= MAX_ATTEMPTS;
}
