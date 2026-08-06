/**
 * Phase 3 — retention, identity and collections.
 *
 * Everything here is derived from, or stored alongside, the Phase 1/2 data.
 * No Phase 2 structure is duplicated: XP, levels, achievements, daily missions
 * and boards stay in their own stores and are only *read* by Phase 3.
 */

import type { Difficulty } from "./difficulty";
import type { GameMode } from "./modes";

export const PHASE3_VERSION = 3 as const;

/* ---------------- limits ---------------- */

export const LIMITS = {
  runHistory: 100,
  dailyAggregates: 90,
  notifications: 50,
  recentUnlocks: 20,
  leaderboardEntries: 25,
} as const;

/* ---------------- run history ---------------- */

export interface RunHistoryEntry {
  id: string;
  timestamp: number;
  mode: GameMode;
  score: number;
  difficulty: Difficulty;
  boardId: string;
  correct: number;
  mistakes: number;
  /** 0..1 */
  accuracy: number;
  longestCombo: number;
  perfect: number;
  great: number;
  closeCalls: number;
  avgReaction: number | null;
  fastestReaction: number | null;
  durationMs: number;
  xpEarned: number;
  newBest: boolean;
  /** highest dynamic-difficulty tier reached in this run (1..5) */
  tier: number;
}

export interface DailyAggregate {
  date: string;
  games: number;
  totalScore: number;
  bestScore: number;
  correct: number;
  mistakes: number;
  perfect: number;
  xp: number;
  reactionTotal: number;
  reactionSamples: number;
}

/* ---------------- streak ---------------- */

export interface PlayStreakState {
  current: number;
  longest: number;
  lastQualifiedDate: string | null;
  uniquePlayDates: number;
  /** milestone day-counts already paid */
  grantedMilestones: number[];
}

/* ---------------- daily login ---------------- */

export interface LoginRewardState {
  /** 1..7 — the day that is currently claimable */
  cycleDay: number;
  lastClaimDate: string | null;
  totalClaimed: number;
  completedCycles: number;
}

/* ---------------- weekly challenges ---------------- */

export type WeeklyCategory =
  | "totalScore"
  | "games"
  | "correct"
  | "perfect"
  | "closeCalls"
  | "combo"
  | "xp"
  | "dailyMissions"
  | "difficulties"
  | "boards";

export type WeeklyTier = "accessible" | "medium" | "challenging";

export interface WeeklyChallenge {
  id: string;
  weekKey: string;
  type: WeeklyCategory;
  tier: WeeklyTier;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardXp: number;
  completed: boolean;
  claimed: boolean;
  completedAt: number | null;
  claimedAt: number | null;
  /** set-valued challenges track distinct ids instead of a counter */
  tracked?: string[];
}

export interface WeeklyState {
  weekKey: string;
  challenges: WeeklyChallenge[];
  lifetimeCompleted: number;
}

/* ---------------- titles & badges ---------------- */

export interface PlayerTitle {
  id: string;
  name: string;
  description: string;
}

export type BadgeTier = "bronze" | "silver" | "gold" | "diamond";

export interface CollectibleBadge {
  id: string;
  name: string;
  description: string;
  tier: BadgeTier;
  icon: string;
}

/* ---------------- notifications ---------------- */

export type NotificationKind =
  | "achievement"
  | "board"
  | "title"
  | "badge"
  | "level"
  | "mission"
  | "weekly"
  | "streak"
  | "login";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  /** optional deep-link target handled by the shell */
  target?: "profile" | "collection" | "missions" | "achievements" | "boards" | "weekly";
}

/* ---------------- combined store ---------------- */

export interface Phase3State {
  version: typeof PHASE3_VERSION;
  runHistory: RunHistoryEntry[];
  dailyAggregates: DailyAggregate[];
  streak: PlayStreakState;
  login: LoginRewardState;
  weekly: WeeklyState;
  unlockedTitleIds: string[];
  equippedTitleId: string;
  titleUnlockDates: Record<string, number>;
  unlockedBadgeIds: string[];
  equippedBadgeId: string | null;
  badgeUnlockDates: Record<string, number>;
  notifications: AppNotification[];
  processedNotificationIds: string[];
  recentUnlockIds: string[];
  uniqueBoardEquipHistory: string[];
  /** number of runs that reached the Chaos tier */
  chaosRuns: number;
  highestTier: number;
}
