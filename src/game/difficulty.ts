import type { TargetColor } from "./types";

export interface DifficultyLevel {
  level: number;
  label: string;
  minimumScore: number;
  maximumScore: number;
  targetDuration: number;
  minimumSpawnDelay: number;
  maximumSpawnDelay: number;
  /** relative multiplier applied to the computed target diameter */
  targetSize: number;
  backgroundIntensity?: number;
}

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    level: 1,
    label: "Warm-up",
    minimumScore: 0,
    maximumScore: 9,
    targetDuration: 1400,
    minimumSpawnDelay: 350,
    maximumSpawnDelay: 600,
    targetSize: 1,
    backgroundIntensity: 0,
  },
  {
    level: 2,
    label: "Quick",
    minimumScore: 10,
    maximumScore: 19,
    targetDuration: 1150,
    minimumSpawnDelay: 320,
    maximumSpawnDelay: 540,
    targetSize: 0.97,
    backgroundIntensity: 0.25,
  },
  {
    level: 3,
    label: "Sharp",
    minimumScore: 20,
    maximumScore: 34,
    targetDuration: 950,
    minimumSpawnDelay: 290,
    maximumSpawnDelay: 480,
    targetSize: 0.94,
    backgroundIntensity: 0.5,
  },
  {
    level: 4,
    label: "Blazing",
    minimumScore: 35,
    maximumScore: 49,
    targetDuration: 800,
    minimumSpawnDelay: 260,
    maximumSpawnDelay: 420,
    targetSize: 0.9,
    backgroundIntensity: 0.75,
  },
  {
    level: 5,
    label: "Insane",
    minimumScore: 50,
    maximumScore: Number.POSITIVE_INFINITY,
    targetDuration: 650,
    minimumSpawnDelay: 230,
    maximumSpawnDelay: 360,
    targetSize: 0.86,
    backgroundIntensity: 1,
  },
];

export function levelForScore(score: number): DifficultyLevel {
  let current = DIFFICULTY_LEVELS[0];
  for (const level of DIFFICULTY_LEVELS) {
    if (score >= level.minimumScore) current = level;
  }
  return current;
}

export function spawnDelayFor(level: DifficultyLevel): number {
  const span = level.maximumSpawnDelay - level.minimumSpawnDelay;
  return level.minimumSpawnDelay + Math.random() * span;
}

export function difficultyProgress(score: number) {
  const current = levelForScore(score);
  const next = DIFFICULTY_LEVELS[current.level] as
    | DifficultyLevel
    | undefined;
  if (!next) return { label: current.label, progress: 1, isMax: true };
  const span = next.minimumScore - current.minimumScore;
  return {
    label: current.label,
    progress: Math.min(1, Math.max(0, (score - current.minimumScore) / span)),
    isMax: false,
  };
}

/**
 * Target distribution — green 48%, red 32%, gold 10%, purple 10%.
 * The same colour may never appear more than three times in a row: when a
 * fourth repeat would occur we reroll across the remaining colours using
 * their original weights (so gold/purple stay proportionally rare).
 */
const DISTRIBUTION: { color: TargetColor; weight: number }[] = [
  { color: "green", weight: 48 },
  { color: "red", weight: 32 },
  { color: "gold", weight: 10 },
  { color: "purple", weight: 10 },
];

function weightedPick(pool: { color: TargetColor; weight: number }[]) {
  const total = pool.reduce((s, d) => s + d.weight, 0);
  let r = Math.random() * total;
  for (const d of pool) {
    r -= d.weight;
    if (r <= 0) return d.color;
  }
  return pool[pool.length - 1].color;
}

export function pickColor(recent: TargetColor[]): TargetColor {
  const blocked =
    recent.length >= 3 &&
    recent[0] === recent[1] &&
    recent[1] === recent[2]
      ? recent[0]
      : null;
  const pool = blocked
    ? DISTRIBUTION.filter((d) => d.color !== blocked)
    : DISTRIBUTION;
  return weightedPick(pool);
}
