import type { GameMode } from "./modes";
import { MODE_CONFIG } from "./modes";
import type { TargetColor } from "./types";
import type {
  ModeCategory,
  PlayableMode,
  TrainingDifficulty,
  TrainingModule,
} from "./trainingTypes";

/**
 * Every tunable number for Zen Mode, Kids Assist, Reflex Trainer and the
 * pre-game countdown lives here. Components read this file — they never
 * hard-code timings.
 */

/* ---------------- mode catalogue ---------------- */

export interface ModeCatalogEntry {
  id: PlayableMode;
  name: string;
  description: string;
  category: ModeCategory;
  /** does this mode grant ordinary gameplay XP? */
  xp: "full" | "limited" | "none";
  xpLabel: string;
  /** does this mode progress competitive achievements? */
  achievements: boolean;
  /** can the session end on its own? */
  canEnd: boolean;
  endLabel: string;
  accentClass: string;
}

export const MODE_CATALOG: Record<PlayableMode, ModeCatalogEntry> = {
  classic: {
    id: "classic",
    name: "Classic",
    description: "The original Tap or Trap experience.",
    category: "competitive",
    xp: "full",
    xpLabel: "Full XP",
    achievements: true,
    canEnd: true,
    endLabel: "Ends on a mistake",
    accentClass: "text-neon-green",
  },
  blitz: {
    id: "blitz",
    name: "Blitz",
    description: "Score as much as possible in 30 seconds.",
    category: "competitive",
    xp: "full",
    xpLabel: "Full XP",
    achievements: true,
    canEnd: true,
    endLabel: "Ends after 30 seconds",
    accentClass: "text-neon-gold",
  },
  survival: {
    id: "survival",
    name: "Survival",
    description: "Three lives. How long can you last?",
    category: "competitive",
    xp: "full",
    xpLabel: "Full XP",
    achievements: true,
    canEnd: true,
    endLabel: "Ends at zero lives",
    accentClass: "text-neon-red",
  },
  focus: {
    id: "focus",
    name: "Focus",
    description: "Green and gold only. Pure speed.",
    category: "competitive",
    xp: "full",
    xpLabel: "Full XP",
    achievements: true,
    canEnd: true,
    endLabel: "Ends on a mistake",
    accentClass: "text-neon-purple",
  },
  zen: {
    id: "zen",
    name: "Zen Mode",
    description: "Relax, tap, and play without pressure.",
    category: "training",
    xp: "limited",
    xpLabel: "Up to 20 XP per day",
    achievements: false,
    canEnd: false,
    endLabel: "Endless — you end it",
    accentClass: "text-neon-green",
  },
  trainer: {
    id: "trainer",
    name: "Reflex Trainer",
    description: "Practice each target type at your own pace.",
    category: "training",
    xp: "limited",
    xpLabel: "10 XP first time per module",
    achievements: false,
    canEnd: true,
    endLabel: "Ends after the target count",
    accentClass: "text-neon-gold",
  },
};

export const COMPETITIVE_MODES: GameMode[] = ["classic", "blitz", "survival", "focus"];
export const TRAINING_MODE_IDS = ["zen", "trainer"] as const;

export const TRAINING_DISCLAIMER =
  "Training records are stored separately and never affect competitive high scores.";

export function isTrainingMode(mode: PlayableMode): mode is "zen" | "trainer" {
  return mode === "zen" || mode === "trainer";
}

/** Best-record label shown on each mode card. */
export function modeRecordLabel(mode: PlayableMode): string {
  if (mode === "zen") return "BEST TAPS";
  if (mode === "trainer") return "BEST ACCURACY";
  return `BEST ${MODE_CONFIG[mode as GameMode].name.toUpperCase()}`;
}

/* ---------------- Zen Mode ---------------- */

export interface ZenTier {
  minTaps: number;
  duration: number;
}

export const ZEN_TIERS: ZenTier[] = [
  { minTaps: 0, duration: 1800 },
  { minTaps: 20, duration: 1500 },
  { minTaps: 50, duration: 1250 },
  { minTaps: 100, duration: 1050 },
  { minTaps: 200, duration: 900 },
];

/** Zen never gets faster than this, whatever the tap count. */
export const ZEN_SPEED_FLOOR = 900;

export const ZEN_CONFIG = {
  spawnDelay: { min: 400, max: 700 },
  targetPx: 88,
  colors: ["green"] as TargetColor[],
  /** below this the session is discarded entirely */
  minTapsToRecord: 5,
  minDurationToRecordMs: 10_000,
  /** XP eligibility */
  xpSessionSeconds: 60,
  xpSessionTaps: 30,
  xpPerSession: 20,
  xpDailyCap: 20,
} as const;

export const KIDS_ASSIST_CONFIG = {
  label: "Kids Assist",
  description: "Larger targets, slower pacing, and encouraging feedback.",
  note: "Kids Assist progress stays in Training and does not affect competitive scores.",
  targetPx: 108,
  spawnDelay: { min: 500, max: 850 },
  /** never faster than this, even after long play */
  speedFloor: 1400,
  tiers: [
    { minTaps: 0, duration: 2200 },
    { minTaps: 50, duration: 1900 },
    { minTaps: 120, duration: 1600 },
    { minTaps: 250, duration: 1400 },
  ] as ZenTier[],
  celebrationEvery: 10,
  /** keeps targets away from the extreme corners */
  centerBias: 0.55,
} as const;

export const KIDS_PRAISE = [
  "Great job!",
  "Awesome!",
  "Nice tap!",
  "You got it!",
  "Keep going!",
  "Amazing!",
  "Super tap!",
  "Well done!",
] as const;

export const ZEN_MISS_MESSAGES = ["Keep going", "Try the next one", "Almost"] as const;

export function zenDuration(taps: number, kidsAssist: boolean): number {
  const tiers = kidsAssist ? KIDS_ASSIST_CONFIG.tiers : ZEN_TIERS;
  const floor = kidsAssist ? KIDS_ASSIST_CONFIG.speedFloor : ZEN_SPEED_FLOOR;
  let duration = tiers[0].duration;
  for (const tier of tiers) {
    if (taps >= tier.minTaps) duration = tier.duration;
  }
  return Math.max(floor, duration);
}

/* ---------------- Reflex Trainer ---------------- */

export interface TrainerModuleConfig {
  id: TrainingModule;
  name: string;
  rule: string;
  objective: string;
  colors: TargetColor[];
  sessionLength: number;
  /** distribution weights, only used by the mixed module */
  distribution: { color: TargetColor; weight: number }[] | null;
  tracksReaction: boolean;
}

export const TRAINER_MODULES: Record<TrainingModule, TrainerModuleConfig> = {
  green: {
    id: "green",
    name: "Green Practice",
    rule: "Tap every green TAP target once.",
    objective: "Build clean, consistent single taps.",
    colors: ["green"],
    sessionLength: 20,
    distribution: null,
    tracksReaction: true,
  },
  red: {
    id: "red",
    name: "Red Trap Practice",
    rule: "Never tap a red TRAP. Let it expire.",
    objective: "Train yourself to hold back.",
    colors: ["red"],
    sessionLength: 15,
    distribution: null,
    tracksReaction: false,
  },
  gold: {
    id: "gold",
    name: "Gold Bonus Practice",
    rule: "Tap every gold BONUS target once.",
    objective: "Catch the rare high-value targets.",
    colors: ["gold"],
    sessionLength: 15,
    distribution: null,
    tracksReaction: true,
  },
  purple: {
    id: "purple",
    name: "Purple Double-Tap Practice",
    rule: "Tap each purple ×2 target twice.",
    objective: "Nail the double tap every time.",
    colors: ["purple"],
    sessionLength: 15,
    distribution: null,
    tracksReaction: true,
  },
  mixed: {
    id: "mixed",
    name: "Mixed Practice",
    rule: "All four target types, one after another.",
    objective: "Put every rule together under pressure.",
    colors: ["green", "red", "gold", "purple"],
    sessionLength: 25,
    distribution: [
      { color: "green", weight: 35 },
      { color: "red", weight: 25 },
      { color: "gold", weight: 20 },
      { color: "purple", weight: 20 },
    ],
    tracksReaction: true,
  },
};

export interface TrainerTiming {
  id: TrainingDifficulty;
  name: string;
  duration: number;
  spawnDelay: { min: number; max: number };
  sizeScale: number;
}

export const TRAINER_TIMING: Record<TrainingDifficulty, TrainerTiming> = {
  beginner: {
    id: "beginner",
    name: "Beginner",
    duration: 1800,
    spawnDelay: { min: 500, max: 800 },
    sizeScale: 1.15,
  },
  standard: {
    id: "standard",
    name: "Standard",
    duration: 1300,
    spawnDelay: { min: 350, max: 600 },
    sizeScale: 1,
  },
  fast: {
    id: "fast",
    name: "Fast",
    duration: 850,
    spawnDelay: { min: 250, max: 450 },
    sizeScale: 0.94,
  },
};

/** Pause after a mistake so the correction can be read. */
export const TRAINER_MISTAKE_PAUSE = 650;

export const TRAINER_RULE_REMINDER: Record<TargetColor, string> = {
  green: "Green means tap it once.",
  red: "That was a trap — leave red alone.",
  gold: "Gold is a bonus: tap it once.",
  purple: "Purple needs two taps.",
};

export const TRAINER_XP_PER_MODULE = 10;
export const TRAINING_DAY_XP = 100;

/* ---------------- countdown ---------------- */

export const COUNTDOWN_CONFIG = {
  steps: ["3", "2", "1", "GO"] as const,
  stepMs: 620,
  goMs: 420,
  shortSteps: ["READY", "GO"] as const,
  shortStepMs: 520,
  shortGoMs: 400,
} as const;
