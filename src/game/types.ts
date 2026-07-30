export type TargetColor = "green" | "red" | "gold" | "purple";

export type GamePhase = "start" | "playing" | "paused" | "over";

export type GameOverReason =
  | "tapped-trap"
  | "missed-target"
  | "incomplete-purple"
  | "quit";

/** Explicit lifecycle of a single target. Only one target exists at a time. */
export type TargetState =
  | "waiting"
  | "entering"
  | "active"
  | "resolving"
  | "exiting"
  | "completed";

export interface ActiveTarget {
  id: number;
  color: TargetColor;
  /** pixel position of the target centre inside the measured play area */
  x: number;
  y: number;
  /** rendered diameter in px */
  size: number;
  duration: number;
  spawnedAt: number;
  taps: number;
  state: TargetState;
  resolved: boolean;
}

export interface FloatingFeedback {
  id: number;
  text: string;
  sub?: string;
  x: number;
  y: number;
  tone: TargetColor;
}

export interface GameSettings {
  sound: boolean;
  vibration: boolean;
  reducedMotion: boolean;
}

export interface LifetimeStats {
  gamesPlayed: number;
  highestScore: number;
  bestCombo: number;
  fastestReaction: number | null;
  totalCorrect: number;
  totalGold: number;
  totalTrapsAvoided: number;
  totalPurpleCompletions: number;
}

export interface RunStats {
  successes: number;
  perfect: number;
  fast: number;
  good: number;
  gold: number;
  trapsAvoided: number;
  purpleCompletions: number;
  avgReaction: number | null;
  fastestReaction: number | null;
}

export const EMPTY_RUN_STATS: RunStats = {
  successes: 0,
  perfect: 0,
  fast: 0,
  good: 0,
  gold: 0,
  trapsAvoided: 0,
  purpleCompletions: 0,
  avgReaction: null,
  fastestReaction: null,
};

export const TARGET_LABEL: Record<TargetColor, string> = {
  green: "TAP",
  red: "TRAP",
  gold: "BONUS",
  purple: "×2",
};

export const GAME_OVER_HEADLINE: Record<GameOverReason, string> = {
  "tapped-trap": "TRAPPED!",
  "missed-target": "TOO SLOW!",
  "incomplete-purple": "ONE TAP SHORT!",
  quit: "RUN ENDED",
};

export const GAME_OVER_MESSAGE: Record<GameOverReason, string> = {
  "tapped-trap": "You tapped a trap.",
  "missed-target": "You missed the target.",
  "incomplete-purple": "Purple needed two taps.",
  quit: "You quit this run.",
};
