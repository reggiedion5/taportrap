/**
 * Phase 3 persistence.
 *
 * One versioned key holds every Phase 3 field. Phase 1/2 stores (profile, XP,
 * achievements, missions, boards, statistics, settings) are never touched, so
 * the migration from a Phase 2 save is simply "start with sane defaults".
 */

import { isValidDateString, localDateString } from "./daily";
import { DIFFICULTIES, isDifficulty } from "./difficulty";
import { isGameMode } from "./modes";
import { BADGES, DEFAULT_TITLE_ID, TITLES } from "./cosmetics";
import { defaultLoginState, LOGIN_CYCLE, safeCycleDay } from "./loginRewards";
import { defaultStreak } from "./playStreak";
import { trimNotifications } from "./notifications";
import {
  LIMITS,
  PHASE3_VERSION,
  type AppNotification,
  type DailyAggregate,
  type NotificationKind,
  type Phase3State,
  type RunHistoryEntry,
  type WeeklyChallenge,
  type WeeklyState,
} from "./phase3Types";
import {
  defaultWeeklyState,
  generateWeeklyChallenges,
  rolloverWeekly,
  weekKeyFor,
} from "./weeklyChallenges";

export const PHASE3_KEY = "tap-or-trap-phase3-v3";

/* ---------------- primitives ---------------- */

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function int(value: unknown, fallback = 0): number {
  return Math.max(0, Math.floor(num(value, fallback)));
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringList(value: unknown, allowed?: string[]): string[] {
  const out = list(value).filter((v): v is string => typeof v === "string" && v.length > 0);
  const filtered = allowed ? out.filter((v) => allowed.includes(v)) : out;
  return Array.from(new Set(filtered));
}

function stampMap(value: unknown, allowed: string[]): Record<string, number> {
  const src = asRecord(value);
  const out: Record<string, number> = {};
  for (const [id, at] of Object.entries(src)) {
    if (!allowed.includes(id)) continue;
    const stamp = int(at);
    out[id] = stamp > 0 ? stamp : Date.now();
  }
  return out;
}

/* ---------------- defaults ---------------- */

export function defaultPhase3State(): Phase3State {
  return {
    version: PHASE3_VERSION,
    runHistory: [],
    dailyAggregates: [],
    streak: defaultStreak(),
    login: defaultLoginState(),
    weekly: defaultWeeklyState(),
    unlockedTitleIds: [DEFAULT_TITLE_ID],
    equippedTitleId: DEFAULT_TITLE_ID,
    titleUnlockDates: { [DEFAULT_TITLE_ID]: Date.now() },
    unlockedBadgeIds: [],
    equippedBadgeId: null,
    badgeUnlockDates: {},
    notifications: [],
    processedNotificationIds: [],
    recentUnlockIds: [],
    uniqueBoardEquipHistory: [],
    chaosRuns: 0,
    highestTier: 1,
  };
}

/* ---------------- parsing ---------------- */

const TITLE_IDS = TITLES.map((t) => t.id);
const BADGE_IDS = BADGES.map((b) => b.id);
const NOTIFICATION_KINDS: NotificationKind[] = [
  "achievement",
  "board",
  "title",
  "badge",
  "level",
  "mission",
  "weekly",
  "streak",
  "login",
];

function parseRun(raw: unknown): RunHistoryEntry | null {
  const src = asRecord(raw);
  const id = str(src.id);
  if (!id || !isGameMode(src.mode)) return null;
  const correct = int(src.correct);
  const mistakes = int(src.mistakes);
  const attempts = correct + mistakes;
  const accuracy = num(src.accuracy, attempts > 0 ? correct / attempts : 0);
  return {
    id,
    timestamp: int(src.timestamp, Date.now()) || Date.now(),
    mode: src.mode,
    score: int(src.score),
    difficulty: isDifficulty(src.difficulty) ? src.difficulty : "standard",
    boardId: str(src.boardId) ?? "neon-night",
    correct,
    mistakes,
    accuracy: Math.max(0, Math.min(1, accuracy)),
    longestCombo: int(src.longestCombo),
    perfect: int(src.perfect),
    great: int(src.great),
    closeCalls: int(src.closeCalls),
    avgReaction: src.avgReaction === null ? null : num(src.avgReaction, 0) || null,
    fastestReaction: src.fastestReaction === null ? null : num(src.fastestReaction, 0) || null,
    durationMs: int(src.durationMs),
    xpEarned: int(src.xpEarned),
    newBest: bool(src.newBest),
    tier: Math.min(5, Math.max(1, int(src.tier, 1) || 1)),
  };
}

function parseAggregate(raw: unknown): DailyAggregate | null {
  const src = asRecord(raw);
  if (!isValidDateString(src.date)) return null;
  return {
    date: src.date,
    games: int(src.games),
    totalScore: int(src.totalScore),
    bestScore: int(src.bestScore),
    correct: int(src.correct),
    mistakes: int(src.mistakes),
    perfect: int(src.perfect),
    xp: int(src.xp),
    reactionTotal: Math.max(0, num(src.reactionTotal)),
    reactionSamples: int(src.reactionSamples),
  };
}

function parseWeeklyChallenge(raw: unknown, fallback: WeeklyChallenge): WeeklyChallenge {
  const src = asRecord(raw);
  const completed = bool(src.completed);
  return {
    ...fallback,
    progress: Math.max(0, num(src.progress)),
    completed,
    claimed: completed && bool(src.claimed),
    completedAt: int(src.completedAt) || null,
    claimedAt: int(src.claimedAt) || null,
    tracked: fallback.tracked ? stringList(src.tracked) : undefined,
  };
}

function parseWeekly(raw: unknown, weekKey: string): WeeklyState {
  const src = asRecord(raw);
  const lifetimeCompleted = int(src.lifetimeCompleted);
  const storedKey = isValidDateString(src.weekKey) ? src.weekKey : null;
  if (storedKey !== weekKey) {
    return { weekKey, challenges: generateWeeklyChallenges(weekKey), lifetimeCompleted };
  }
  const generated = generateWeeklyChallenges(weekKey);
  const stored = list(src.challenges);
  const challenges = generated.map((fallback) => {
    const match = stored.find((c) => asRecord(c).id === fallback.id);
    return match ? parseWeeklyChallenge(match, fallback) : fallback;
  });
  return { weekKey, challenges, lifetimeCompleted };
}

function parseNotification(raw: unknown): AppNotification | null {
  const src = asRecord(raw);
  const id = str(src.id);
  const kind = src.kind;
  if (!id || typeof kind !== "string" || !NOTIFICATION_KINDS.includes(kind as NotificationKind)) {
    return null;
  }
  return {
    id,
    kind: kind as NotificationKind,
    title: str(src.title) ?? "Update",
    body: str(src.body) ?? "",
    createdAt: int(src.createdAt, Date.now()) || Date.now(),
    read: bool(src.read),
    target: str(src.target) as AppNotification["target"],
  };
}

export function parsePhase3(raw: unknown, today = localDateString()): Phase3State {
  const src = asRecord(raw);
  const base = defaultPhase3State();
  const weekKey = weekKeyFor(new Date(`${today}T00:00:00`));

  const runHistory = list(src.runHistory)
    .map(parseRun)
    .filter((r): r is RunHistoryEntry => r !== null)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, LIMITS.runHistory);

  const dailyAggregates = list(src.dailyAggregates)
    .map(parseAggregate)
    .filter((a): a is DailyAggregate => a !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, LIMITS.dailyAggregates);

  const streakSrc = asRecord(src.streak);
  const streak = {
    current: int(streakSrc.current),
    longest: int(streakSrc.longest),
    lastQualifiedDate: isValidDateString(streakSrc.lastQualifiedDate)
      ? streakSrc.lastQualifiedDate
      : null,
    uniquePlayDates: int(streakSrc.uniquePlayDates),
    grantedMilestones: list(streakSrc.grantedMilestones)
      .map((v) => int(v))
      .filter((v) => v > 0),
  };
  streak.longest = Math.max(streak.longest, streak.current);

  const loginSrc = asRecord(src.login);
  const login = {
    cycleDay: safeCycleDay(int(loginSrc.cycleDay, 1) || 1),
    lastClaimDate: isValidDateString(loginSrc.lastClaimDate) ? loginSrc.lastClaimDate : null,
    totalClaimed: int(loginSrc.totalClaimed),
    completedCycles: int(
      loginSrc.completedCycles,
      Math.floor(int(loginSrc.totalClaimed) / LOGIN_CYCLE.length),
    ),
  };

  const unlockedTitleIds = Array.from(
    new Set([DEFAULT_TITLE_ID, ...stringList(src.unlockedTitleIds, TITLE_IDS)]),
  );
  const equippedTitleCandidate = str(src.equippedTitleId) ?? DEFAULT_TITLE_ID;
  const equippedTitleId = unlockedTitleIds.includes(equippedTitleCandidate)
    ? equippedTitleCandidate
    : DEFAULT_TITLE_ID;

  const unlockedBadgeIds = stringList(src.unlockedBadgeIds, BADGE_IDS);
  const equippedBadgeCandidate = str(src.equippedBadgeId);
  const equippedBadgeId =
    equippedBadgeCandidate && unlockedBadgeIds.includes(equippedBadgeCandidate)
      ? equippedBadgeCandidate
      : null;

  const notifications = trimNotifications(
    list(src.notifications)
      .map(parseNotification)
      .filter((n): n is AppNotification => n !== null),
  );

  return {
    ...base,
    runHistory,
    dailyAggregates,
    streak,
    login,
    weekly: rolloverWeekly(parseWeekly(src.weekly, weekKey), weekKey),
    unlockedTitleIds,
    equippedTitleId,
    titleUnlockDates: {
      [DEFAULT_TITLE_ID]: Date.now(),
      ...stampMap(src.titleUnlockDates, TITLE_IDS),
    },
    unlockedBadgeIds,
    equippedBadgeId,
    badgeUnlockDates: stampMap(src.badgeUnlockDates, BADGE_IDS),
    notifications,
    processedNotificationIds: stringList(src.processedNotificationIds).slice(
      -(LIMITS.notifications * 4),
    ),
    recentUnlockIds: stringList(src.recentUnlockIds).slice(0, LIMITS.recentUnlocks),
    uniqueBoardEquipHistory: stringList(src.uniqueBoardEquipHistory),
    chaosRuns: int(src.chaosRuns),
    highestTier: Math.min(5, Math.max(1, int(src.highestTier, 1) || 1)),
  };
}

/** Difficulty ids used by the profile screen, kept in one place. */
export const PROFILE_DIFFICULTIES = DIFFICULTIES;
