import type { Difficulty } from "./difficulty";
import type { GameMode } from "./modes";
import type { GameOverReason, RunStats } from "./types";

export const STORAGE_VERSION = 2 as const;
export type StorageVersion = typeof STORAGE_VERSION;

/* ---------------- player profile ---------------- */

export interface PlayerProfile {
  version: StorageVersion;
  level: number;
  currentXp: number;
  lifetimeXp: number;
  /** equipped board (Board Collection). Migrated from the legacy theme id. */
  selectedBoardId: string;
  /** board ids the player has already seen in the collection (NEW badge) */
  seenBoardIds: string[];
  selectedMode: GameMode;
  selectedDifficulty: Difficulty;
  onboardingCompleted: boolean;
  /** Interactive tutorial finished at least once. */
  tutorialCompleted: boolean;
  /** One-time tutorial XP already paid out. */
  tutorialRewardClaimed: boolean;
  seenModeIntros: GameMode[];
  createdAt: number;
  lastPlayedAt: number;
  lastOpenedDate: string;
  totalAchievementsUnlocked: number;
}

export interface PlayerLevel {
  level: number;
  currentXp: number;
  xpForNext: number;
  progress: number;
}

/* ---------------- statistics ---------------- */

export interface ModeStatistics {
  gamesPlayed: number;
  highScore: number;
  totalScore: number;
  totalSuccessfulReactions: number;
  bestCombo: number;
  totalReactionTime: number;
  reactionSampleCount: number;
  fastestReaction: number | null;
  bestAvgReaction: number | null;
  perfectCount: number;
  fastCount: number;
  goodCount: number;
  bestPerfectInRun: number;
  longestRun: number;
  totalPlayTime: number;
  overReasons: Partial<Record<GameOverReason, number>>;
}

export interface PlayerStatistics {
  version: StorageVersion;
  gamesPlayed: number;
  totalScore: number;
  totalSuccessfulReactions: number;
  bestCombo: number;
  totalReactionTime: number;
  reactionSampleCount: number;
  fastestReaction: number | null;
  perfectCount: number;
  fastCount: number;
  goodCount: number;
  totalGold: number;
  totalTrapsAvoided: number;
  totalPurpleCompletions: number;
  totalPlayTime: number;
  modes: Record<GameMode, ModeStatistics>;
}

/* ---------------- personal records ---------------- */

export interface PersonalRecords {
  version: StorageVersion;
  highScore: Record<GameMode, number>;
  /** best score per mode, split by chosen difficulty tier */
  highScoreByDifficulty: Record<GameMode, Record<Difficulty, number>>;
  bestCombo: number;
  fastestReaction: number | null;
  bestAvgReaction: number | null;
  mostPerfectInRun: number;
  mostGoldInRun: number;
  mostTrapsAvoidedInRun: number;
  mostPurpleInRun: number;
  longestSurvivalRun: number;
  focusTunnelVision: boolean;
}

export type PersonalRecordKey =
  | "score"
  | "bestCombo"
  | "fastestReaction"
  | "bestAvgReaction"
  | "mostPerfectInRun"
  | "mostGoldInRun"
  | "mostTrapsAvoidedInRun"
  | "mostPurpleInRun"
  | "longestSurvivalRun";

/* ---------------- achievements ---------------- */

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";

export type AchievementCategory =
  "beginner" | "combo" | "reaction" | "mastery" | "modes" | "progression";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  rewardXp: number;
  target: number;
  /** current progress value derived from persisted data */
  value: (ctx: AchievementContext) => number;
  format?: (value: number) => string;
}

export interface AchievementContext {
  stats: PlayerStatistics;
  records: PersonalRecords;
  daily: DailyState;
  profile: PlayerProfile;
}

export interface AchievementProgress {
  id: string;
  value: number;
  target: number;
  unlocked: boolean;
  unlockedAt: number | null;
}

export interface AchievementStore {
  version: StorageVersion;
  unlocked: Record<string, number>;
  /** achievement ids whose XP reward has already been paid out */
  claimed: Record<string, number>;
}


/* ---------------- daily challenge ---------------- */

export type DailyChallengeType =
  | "classic-score"
  | "traps-avoided"
  | "purple-complete"
  | "gold-collect"
  | "combo-reach"
  | "perfect-count"
  | "blitz-score"
  | "survival-reactions"
  | "focus-average"
  | "multiplier-reach";

export interface DailyChallenge {
  id: string;
  date: string;
  type: DailyChallengeType;
  objective: string;
  target: number;
  mode: GameMode | null;
  /** lower-is-better objectives (reaction time) */
  lowerIsBetter: boolean;
}

export interface DailyState {
  version: StorageVersion;
  currentDate: string;
  challengeId: string;
  progress: number;
  completed: boolean;
  rewardClaimed: boolean;
  completedDate: string | null;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string | null;
  totalCompleted: number;
}

/* ---------------- post-game missions ---------------- */

export interface PostGameMission {
  id: string;
  mode: GameMode;
  label: string;
  target: number;
  metric: "score" | "combo" | "perfect" | "traps" | "gold" | "purple" | "successes" | "avgReaction";
  lowerIsBetter: boolean;
  attempts: number;
}

/* ---------------- session result ---------------- */

export interface GameSessionResult {
  sessionId: string;
  mode: GameMode;
  /** difficulty active when this run started — never re-read after the run */
  difficulty?: Difficulty;
  score: number;
  bestCombo: number;
  bestMultiplier: number;
  stats: RunStats;
  reason: GameOverReason | null;
  durationMs: number;
  livesRemaining: number | null;
  completed: boolean;
}

export interface XpRewardBreakdown {
  entries: { label: string; xp: number }[];
  total: number;
}
