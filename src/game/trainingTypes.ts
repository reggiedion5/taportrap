import type { GameMode } from "./modes";
import type { TargetColor } from "./types";

/* ---------------- shared vocabulary ---------------- */

export type ModeCategory = "competitive" | "training";

/** Non-competitive modes. They never touch competitive records. */
export type TrainingMode = "zen" | "trainer";

/** Anything the player can launch from the mode selector. */
export type PlayableMode = GameMode | TrainingMode;

export type TrainingModule = "green" | "red" | "gold" | "purple" | "mixed";

export type TrainingDifficulty = "beginner" | "standard" | "fast";

export type SessionEndType =
  | "game-over"
  | "time-expired"
  | "lives-depleted"
  | "manual-completion"
  | "training-complete"
  | "quit";

export type FeedbackCategory = "bug" | "gameplay" | "suggestion" | "accessibility" | "other";

export const TRAINING_MODULES: TrainingModule[] = ["green", "red", "gold", "purple", "mixed"];

export const TRAINING_DIFFICULTIES: TrainingDifficulty[] = ["beginner", "standard", "fast"];

export function isTrainingModule(value: unknown): value is TrainingModule {
  return typeof value === "string" && (TRAINING_MODULES as string[]).includes(value);
}

export function isTrainingDifficulty(value: unknown): value is TrainingDifficulty {
  return typeof value === "string" && (TRAINING_DIFFICULTIES as string[]).includes(value);
}

/* ---------------- persisted statistics ---------------- */

export const TRAINING_STORAGE_VERSION = 1 as const;

export interface ZenStatistics {
  sessionsCompleted: number;
  totalTaps: number;
  longestSessionMs: number;
  longestStreak: number;
  bestTapCount: number;
  totalPlayTime: number;
  kidsAssistSessions: number;
}

export interface TrainerModuleStatistics {
  sessions: number;
  targetsPracticed: number;
  correct: number;
  mistakes: number;
  bestAccuracy: number;
  bestAvgReaction: number | null;
  fastestReaction: number | null;
  totalTime: number;
  /** the one-off 10 XP completion reward has been paid for this module */
  firstRewardClaimed: boolean;
}

export interface TrainerStatistics {
  sessions: number;
  totalTargets: number;
  totalCorrect: number;
  totalTime: number;
  modules: Record<TrainingModule, TrainerModuleStatistics>;
  /** the "Training Day" 100 XP reward has been paid */
  trainingDayClaimed: boolean;
}

export interface TrainingStore {
  version: typeof TRAINING_STORAGE_VERSION;
  zen: ZenStatistics;
  trainer: TrainerStatistics;
  /** last competitive mode, so training never overwrites the player's pick */
  lastCompetitiveMode: GameMode;
}

/* ---------------- session results ---------------- */

export interface ZenSessionResult {
  sessionId: string;
  taps: number;
  longestStreak: number;
  durationMs: number;
  avgReaction: number | null;
  fastestReaction: number | null;
  kidsAssist: boolean;
  /** milestones celebrated during the session (every 10 taps) */
  celebrations: number;
}

export interface TrainerTypeBreakdown {
  seen: number;
  correct: number;
}

export interface TrainerSessionResult {
  sessionId: string;
  module: TrainingModule;
  difficulty: TrainingDifficulty;
  targetsPresented: number;
  correct: number;
  mistakes: number;
  missed: number;
  accuracy: number;
  avgReaction: number | null;
  fastestReaction: number | null;
  perfect: number;
  bestStreak: number;
  durationMs: number;
  /** red module only */
  trapsAvoided: number;
  trapTaps: number;
  /** purple module only */
  purpleCompleted: number;
  purpleOneTap: number;
  purpleZeroTap: number;
  breakdown: Record<TargetColor, TrainerTypeBreakdown>;
}

/** Result of persisting a completed training session. */
export interface TrainingRewardResult {
  xpAwarded: number;
  reasons: { label: string; xp: number }[];
  newRecords: string[];
}
