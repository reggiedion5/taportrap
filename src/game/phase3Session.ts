/**
 * Folds one completed run into the Phase 3 state.
 *
 * Pure and deterministic: it never touches storage, never grants XP by itself
 * (it returns the amount owed) and is safe to call twice for the same session
 * because run ids, milestone ids and notification ids are all de-duplicated.
 */

import { localDateString } from "./daily";
import type { Difficulty } from "./difficulty";
import {
  BADGES,
  TITLES,
  evaluateBadges,
  evaluateTitles,
  type CosmeticContext,
} from "./cosmetics";
import { pushNotifications, type NotificationInput } from "./notifications";
import { appendAggregate, appendRun, buildRunEntry } from "./runHistory";
import { registerPlayDay, STREAK_MILESTONES } from "./playStreak";
import { applyRunToWeekly, weekKeyFor } from "./weeklyChallenges";
import { LIMITS, type Phase3State, type RunHistoryEntry, type WeeklyChallenge } from "./phase3Types";
import type { GameSessionResult } from "./progressionTypes";

export interface Phase3RunInput {
  result: GameSessionResult;
  difficulty: Difficulty;
  boardId: string;
  xpEarned: number;
  newBest: boolean;
  dailyMissionsCompleted: number;
  /** cosmetic context computed from the post-run Phase 1/2 stores */
  cosmetics: CosmeticContext;
  today?: string;
  timestamp?: number;
}

export interface Phase3RunOutcome {
  state: Phase3State;
  run: RunHistoryEntry;
  /** XP owed for play-streak milestones reached by this run */
  streakXp: number;
  streakDays: number;
  streakAdvanced: boolean;
  milestoneDays: number[];
  weeklyCompleted: WeeklyChallenge[];
  unlockedTitleIds: string[];
  unlockedBadgeIds: string[];
}

export function applyRunToPhase3(
  state: Phase3State,
  input: Phase3RunInput,
): Phase3RunOutcome {
  const today = input.today ?? localDateString();
  const timestamp = input.timestamp ?? Date.now();
  const run = buildRunEntry({
    result: input.result,
    difficulty: input.difficulty,
    boardId: input.boardId,
    xpEarned: input.xpEarned,
    newBest: input.newBest,
    timestamp,
  });

  const alreadyRecorded = state.runHistory.some((h) => h.id === run.id);
  if (alreadyRecorded) {
    return {
      state,
      run,
      streakXp: 0,
      streakDays: state.streak.current,
      streakAdvanced: false,
      milestoneDays: [],
      weeklyCompleted: [],
      unlockedTitleIds: [],
      unlockedBadgeIds: [],
    };
  }

  const runHistory = appendRun(state.runHistory, run);
  const dailyAggregates = appendAggregate(state.dailyAggregates, run, today);

  const streakOutcome = registerPlayDay(state.streak, today);
  const streakXp = streakOutcome.milestones.reduce((sum, m) => sum + m.xp, 0);
  const milestoneBadges = streakOutcome.milestones
    .map((m) => m.badgeId)
    .filter((id): id is string => Boolean(id));

  const weeklyOutcome = applyRunToWeekly(
    state.weekly,
    {
      score: run.score,
      correct: run.correct,
      perfect: run.perfect,
      closeCalls: run.closeCalls,
      bestCombo: run.longestCombo,
      xpEarned: run.xpEarned,
      dailyMissionsCompleted: Math.max(0, input.dailyMissionsCompleted),
      difficulty: run.difficulty,
      boardId: run.boardId,
    },
    weekKeyFor(new Date(`${today}T00:00:00`)),
  );

  const boardEquipHistory = Array.from(
    new Set([...state.uniqueBoardEquipHistory, run.boardId]),
  );
  const chaosRuns = state.chaosRuns + (run.tier >= 5 ? 1 : 0);
  const highestTier = Math.max(state.highestTier, run.tier);

  // Cosmetics are evaluated against post-run values so a run can unlock them.
  const ctx: CosmeticContext = {
    ...input.cosmetics,
    boardsEquipped: boardEquipHistory.length,
    chaosRuns,
    playStreakLongest: Math.max(
      input.cosmetics.playStreakLongest,
      streakOutcome.state.longest,
    ),
  };

  const unlockedBadgeSeed = Array.from(
    new Set([...state.unlockedBadgeIds, ...milestoneBadges]),
  );
  const newTitleIds = evaluateTitles(ctx, state.unlockedTitleIds);
  const newBadgeIds = Array.from(
    new Set([
      ...milestoneBadges.filter((id) => !state.unlockedBadgeIds.includes(id)),
      ...evaluateBadges(ctx, unlockedBadgeSeed),
    ]),
  );

  const stamps = (ids: string[], existing: Record<string, number>) => {
    if (ids.length === 0) return existing;
    const next = { ...existing };
    for (const id of ids) next[id] = timestamp;
    return next;
  };

  const notificationInputs: NotificationInput[] = [
    ...streakOutcome.milestones.map((m) => ({
      id: `streak-${m.days}`,
      kind: "streak" as const,
      title: `${m.days}-day streak!`,
      body: `You earned ${m.xp} XP for playing ${m.days} days in a row.`,
      target: "profile" as const,
    })),
    ...weeklyOutcome.completed.map((c) => ({
      id: `weekly-${c.id}`,
      kind: "weekly" as const,
      title: "Weekly challenge complete",
      body: `${c.title} — claim ${c.rewardXp} XP.`,
      target: "weekly" as const,
    })),
    ...newTitleIds.map((id) => ({
      id: `title-${id}`,
      kind: "title" as const,
      title: "New title unlocked",
      body: TITLES.find((t) => t.id === id)?.name ?? id,
      target: "collection" as const,
    })),
    ...newBadgeIds.map((id) => ({
      id: `badge-${id}`,
      kind: "badge" as const,
      title: "New badge earned",
      body: BADGES.find((b) => b.id === id)?.name ?? id,
      target: "collection" as const,
    })),
  ];

  const pushed = pushNotifications(
    state.notifications,
    state.processedNotificationIds,
    notificationInputs,
    timestamp,
  );

  const nextState: Phase3State = {
    ...state,
    runHistory,
    dailyAggregates,
    streak: streakOutcome.state,
    weekly: weeklyOutcome.state,
    unlockedTitleIds: [...state.unlockedTitleIds, ...newTitleIds],
    titleUnlockDates: stamps(newTitleIds, state.titleUnlockDates),
    unlockedBadgeIds: [...state.unlockedBadgeIds, ...newBadgeIds],
    badgeUnlockDates: stamps(newBadgeIds, state.badgeUnlockDates),
    notifications: pushed.notifications,
    processedNotificationIds: pushed.processedIds,
    recentUnlockIds: [
      ...newTitleIds.map((id) => `title-${id}`),
      ...newBadgeIds.map((id) => `badge-${id}`),
      ...state.recentUnlockIds,
    ].slice(0, LIMITS.recentUnlocks),
    uniqueBoardEquipHistory: boardEquipHistory,
    chaosRuns,
    highestTier,
  };

  return {
    state: nextState,
    run,
    streakXp,
    streakDays: streakOutcome.state.current,
    streakAdvanced: streakOutcome.advanced,
    milestoneDays: streakOutcome.milestones.map((m) => m.days),
    weeklyCompleted: weeklyOutcome.completed,
    unlockedTitleIds: newTitleIds,
    unlockedBadgeIds: newBadgeIds,
  };
}

export const STREAK_MILESTONE_DAYS = STREAK_MILESTONES.map((m) => m.days);
