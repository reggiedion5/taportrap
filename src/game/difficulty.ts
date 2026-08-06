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
    label: "Warm-Up",
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
    label: "Fast",
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
    label: "Blitz",
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
    label: "Chaos",
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

export function spawnDelayFor(level: DifficultyLevel, spawnScale = 1): number {
  const span = level.maximumSpawnDelay - level.minimumSpawnDelay;
  return (level.minimumSpawnDelay + Math.random() * span) * spawnScale;
}

/** Player-chosen difficulty. Scales pacing on top of the score-based ramp. */
export type Difficulty = "beginner" | "standard" | "expert";

export const DIFFICULTIES: Difficulty[] = ["beginner", "standard", "expert"];

export interface DifficultyPreset {
  id: Difficulty;
  label: string;
  short: string;
  blurb: string;
  /** multiplies how long a target stays on screen */
  durationScale: number;
  /** multiplies the gap between targets */
  spawnScale: number;
  /** multiplies the XP earned in a run */
  xpScale: number;
}

export const DIFFICULTY_PRESETS: Record<Difficulty, DifficultyPreset> = {
  beginner: {
    id: "beginner",
    label: "Beginner",
    short: "EASY",
    blurb: "Targets linger and arrive a little slower.",
    durationScale: 1.25,
    spawnScale: 1.25,
    xpScale: 0.7,
  },
  standard: {
    id: "standard",
    label: "Standard",
    short: "NORMAL",
    blurb: "The classic Tap or Trap! pace.",
    durationScale: 1,
    spawnScale: 1,
    xpScale: 1,
  },
  expert: {
    id: "expert",
    label: "Expert",
    short: "HARD",
    blurb: "Faster targets with barely any breathing room.",
    durationScale: 0.8,
    spawnScale: 0.7,
    xpScale: 1.3,
  },
};

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && (DIFFICULTIES as string[]).includes(value);
}

export function presetFor(difficulty: Difficulty | undefined): DifficultyPreset {
  return DIFFICULTY_PRESETS[difficulty ?? "standard"] ?? DIFFICULTY_PRESETS.standard;
}

export function difficultyProgress(score: number) {
  const current = levelForScore(score);
  const next = DIFFICULTY_LEVELS[current.level] as DifficultyLevel | undefined;
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

export function pickColor(
  recent: TargetColor[],
  allowed: TargetColor[] = ["green", "red", "gold", "purple"],
): TargetColor {
  const available = DISTRIBUTION.filter((d) => allowed.includes(d.color));
  const pool = available.length ? available : DISTRIBUTION;
  const blocked =
    recent.length >= 3 && recent[0] === recent[1] && recent[1] === recent[2] ? recent[0] : null;
  const filtered = blocked ? pool.filter((d) => d.color !== blocked) : pool;
  return weightedPick(filtered.length ? filtered : pool);
}
