export type TargetColor = "green" | "red" | "gold" | "purple";

export type GamePhase = "start" | "playing" | "paused" | "over";

export type GameOverReason = "trap" | "missed" | "purple-single";

export interface DifficultyLevel {
  minScore: number;
  duration: number;
  label: string;
}

export interface ActiveTarget {
  id: number;
  color: TargetColor;
  /** percentage inside the play area */
  x: number;
  y: number;
  size: number;
  duration: number;
  spawnedAt: number;
  taps: number;
}

export interface FloatingFeedback {
  id: number;
  text: string;
  x: number;
  y: number;
  tone: TargetColor;
}

export interface GameSettings {
  sound: boolean;
  vibration: boolean;
}

export interface GameStats {
  score: number;
  combo: number;
  bestCombo: number;
  multiplier: number;
  avgReaction: number | null;
}

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { minScore: 0, duration: 1400, label: "Warm-up" },
  { minScore: 10, duration: 1150, label: "Quick" },
  { minScore: 20, duration: 950, label: "Sharp" },
  { minScore: 35, duration: 800, label: "Blazing" },
  { minScore: 50, duration: 650, label: "Insane" },
];

export const TARGET_LABEL: Record<TargetColor, string> = {
  green: "TAP",
  red: "TRAP",
  gold: "BONUS",
  purple: "×2",
};

export const GAME_OVER_MESSAGE: Record<GameOverReason, string> = {
  trap: "You tapped a trap",
  missed: "You missed the target",
  "purple-single": "Purple needed two taps",
};
