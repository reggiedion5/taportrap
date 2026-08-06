import type { TargetColor } from "./types";

export type GameMode = "classic" | "blitz" | "survival" | "focus";

export const GAME_MODES: GameMode[] = ["classic", "blitz", "survival", "focus"];

export interface GameModeConfig {
  id: GameMode;
  name: string;
  tagline: string;
  description: string;
  rules: string[];
  /** target colours that may spawn in this mode */
  colors: TargetColor[];
  /** multiplier applied to the difficulty target duration */
  durationScale: number;
  /** total run clock in ms, or null for endless */
  timeLimitMs: number | null;
  /** number of mistakes allowed before the run ends */
  lives: number;
  /** spawn the next target the instant one is tapped and scored */
  instantRespawnOnScore?: boolean;
  /** ms removed from the clock per mistake (timed modes only) */
  penalties: { missed: number; trap: number; purple: number; extra: number } | null;
  overTitle: string;
  accentVar: string;
}

export const MODE_CONFIG: Record<GameMode, GameModeConfig> = {
  classic: {
    id: "classic",
    name: "Classic",
    tagline: "The original Tap or Trap! experience.",
    description: "One mistake ends the run. Difficulty climbs with your score.",
    rules: [
      "Green and gold: tap once",
      "Red: never tap it",
      "Purple: tap twice",
      "One mistake ends the run",
    ],
    colors: ["green", "red", "gold", "purple"],
    durationScale: 1,
    timeLimitMs: null,
    lives: 1,
    penalties: null,
    overTitle: "Game Over",
    accentVar: "--neon-green",
  },
  blitz: {
    id: "blitz",
    name: "Blitz",
    tagline: "Score as many points as possible in 30 seconds.",
    description: "Mistakes burn clock instead of ending the run. Play until time runs out.",
    rules: [
      "30 second clock",
      "Next target appears instantly",
      "Missed target: −2 seconds",
      "Tapped trap: −5 seconds",
      "Unfinished purple: −3 seconds",
    ],
    colors: ["green", "red", "gold", "purple"],
    durationScale: 1,
    timeLimitMs: 30_000,
    instantRespawnOnScore: true,
    lives: Number.POSITIVE_INFINITY,
    penalties: { missed: 2000, trap: 5000, purple: 3000, extra: 2000 },
    overTitle: "Time's Up",
    accentVar: "--neon-gold",
  },
  survival: {
    id: "survival",
    name: "Survival",
    tagline: "Three lives. How long can you last?",
    description: "Each mistake costs a life and resets your combo.",
    rules: [
      "Start with 3 lives",
      "A mistake costs one life",
      "Combo resets after a mistake",
      "Run ends when lives hit zero",
    ],
    colors: ["green", "red", "gold", "purple"],
    durationScale: 1,
    timeLimitMs: null,
    lives: 3,
    penalties: null,
    overTitle: "Run Over",
    accentVar: "--neon-red",
  },
  focus: {
    id: "focus",
    name: "Focus",
    tagline: "Green and gold only. Pure speed.",
    description: "No traps, no purple. Faster targets and zero forgiveness.",
    rules: [
      "Only green and gold appear",
      "Targets are faster than Classic",
      "Missing any target ends the run",
      "Combo multipliers still apply",
    ],
    colors: ["green", "gold"],
    durationScale: 0.82,
    timeLimitMs: null,
    lives: 1,
    penalties: null,
    overTitle: "Focus Broken",
    accentVar: "--neon-purple",
  },
};

export function isGameMode(value: unknown): value is GameMode {
  return typeof value === "string" && (GAME_MODES as string[]).includes(value);
}
