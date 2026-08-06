/**
 * Phase 1 player statistics — a versioned, self-healing local profile.
 *
 * This store is deliberately independent from the richer progression store: it
 * only records the Phase 1 metrics, it never throws, and every read repairs
 * corrupted or legacy data instead of discarding it.
 */

import { GAME_FEATURES } from "@/config/gameFeatures";

export const PLAYER_STATS_KEY = "tap-or-trap-player-stats-v1";
export const PLAYER_STATS_VERSION = 1 as const;

/** legacy sources kept only so an existing best score is never lost */
const LEGACY_STATS_KEY = "tap-or-trap-stats-v1";
const LEGACY_HIGH_SCORE_KEY = "tap-or-trap-high-score-v1";

export interface PlayerStats {
  version: number;
  totalGames: number;
  totalTaps: number;
  totalMistakes: number;
  bestScore: number;
  totalScore: number;
  longestCombo: number;
  perfectTaps: number;
  greatTaps: number;
  closeCalls: number;
  fastestReaction: number | null;
  totalReactionTime: number;
  reactionSamples: number;
  totalPlayTime: number;
  highestTier: number;
  lastPlayedAt: number | null;
}

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  version: PLAYER_STATS_VERSION,
  totalGames: 0,
  totalTaps: 0,
  totalMistakes: 0,
  bestScore: 0,
  totalScore: 0,
  longestCombo: 0,
  perfectTaps: 0,
  greatTaps: 0,
  closeCalls: 0,
  fastestReaction: null,
  totalReactionTime: 0,
  reactionSamples: 0,
  totalPlayTime: 0,
  highestTier: 1,
  lastPlayedAt: null,
};

export interface RunRecord {
  score: number;
  taps: number;
  mistakes: number;
  longestCombo: number;
  perfectTaps: number;
  greatTaps: number;
  closeCalls: number;
  fastestReaction: number | null;
  totalReactionTime: number;
  reactionSamples: number;
  durationMs: number;
  tier: number;
}

export const EMPTY_RUN_RECORD: RunRecord = {
  score: 0,
  taps: 0,
  mistakes: 0,
  longestCombo: 0,
  perfectTaps: 0,
  greatTaps: 0,
  closeCalls: 0,
  fastestReaction: null,
  totalReactionTime: 0,
  reactionSamples: 0,
  durationMs: 0,
  tier: 1,
};

/* ---------------- coercion helpers ---------------- */

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function optionalNum(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Accepts anything and returns a valid profile — corrupted fields fall back. */
export function normalizePlayerStats(input: unknown): PlayerStats {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  return {
    version: PLAYER_STATS_VERSION,
    totalGames: Math.floor(num(src.totalGames)),
    totalTaps: Math.floor(num(src.totalTaps)),
    totalMistakes: Math.floor(num(src.totalMistakes)),
    bestScore: Math.floor(num(src.bestScore)),
    totalScore: Math.floor(num(src.totalScore)),
    longestCombo: Math.floor(num(src.longestCombo)),
    perfectTaps: Math.floor(num(src.perfectTaps)),
    greatTaps: Math.floor(num(src.greatTaps)),
    closeCalls: Math.floor(num(src.closeCalls)),
    fastestReaction: optionalNum(src.fastestReaction),
    totalReactionTime: num(src.totalReactionTime),
    reactionSamples: Math.floor(num(src.reactionSamples)),
    totalPlayTime: num(src.totalPlayTime),
    highestTier: Math.max(1, Math.floor(num(src.highestTier, 1))),
    lastPlayedAt: optionalNum(src.lastPlayedAt),
  };
}

/* ---------------- storage ---------------- */

function readJson(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Pulls a pre-Phase-1 best score forward so records survive the upgrade. */
function legacyBestScore(): number {
  const legacyStats = readJson(LEGACY_STATS_KEY) as Record<string, unknown> | null;
  const fromStats = num(legacyStats?.highestScore);
  const raw = readJson(LEGACY_HIGH_SCORE_KEY);
  const fromKey = num(typeof raw === "object" && raw ? (raw as { value?: unknown }).value : raw);
  return Math.max(fromStats, fromKey);
}

export function loadPlayerStats(): PlayerStats {
  const stored = readJson(PLAYER_STATS_KEY);
  const stats = normalizePlayerStats(stored);
  if (stored === null) {
    stats.bestScore = Math.max(stats.bestScore, legacyBestScore());
  }
  return stats;
}

export function savePlayerStats(stats: PlayerStats): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(normalizePlayerStats(stats)));
    return true;
  } catch {
    return false;
  }
}

/** Pure merge — used directly by the tests. */
export function mergeRun(stats: PlayerStats, run: RunRecord): PlayerStats {
  const base = normalizePlayerStats(stats);
  const r = { ...EMPTY_RUN_RECORD, ...(run ?? {}) };
  const fastest =
    r.fastestReaction !== null && Number.isFinite(r.fastestReaction) && r.fastestReaction > 0
      ? base.fastestReaction === null
        ? Math.round(r.fastestReaction)
        : Math.min(base.fastestReaction, Math.round(r.fastestReaction))
      : base.fastestReaction;

  return normalizePlayerStats({
    ...base,
    totalGames: base.totalGames + 1,
    totalTaps: base.totalTaps + num(r.taps),
    totalMistakes: base.totalMistakes + num(r.mistakes),
    bestScore: Math.max(base.bestScore, num(r.score)),
    totalScore: base.totalScore + num(r.score),
    longestCombo: Math.max(base.longestCombo, num(r.longestCombo)),
    perfectTaps: base.perfectTaps + num(r.perfectTaps),
    greatTaps: base.greatTaps + num(r.greatTaps),
    closeCalls: base.closeCalls + num(r.closeCalls),
    fastestReaction: fastest,
    totalReactionTime: base.totalReactionTime + num(r.totalReactionTime),
    reactionSamples: base.reactionSamples + num(r.reactionSamples),
    totalPlayTime: base.totalPlayTime + num(r.durationMs),
    highestTier: Math.max(base.highestTier, num(r.tier, 1)),
    lastPlayedAt: Date.now(),
  });
}

/** Records a finished run. Safe to call on any platform; never throws. */
export function recordRun(run: RunRecord): PlayerStats {
  const next = mergeRun(loadPlayerStats(), run);
  if (GAME_FEATURES.statisticsSystem) savePlayerStats(next);
  return next;
}

export function clearPlayerStats() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PLAYER_STATS_KEY);
  } catch {
    /* ignore */
  }
}

/* ---------------- derived values (divide-by-zero safe) ---------------- */

export interface DerivedPlayerStats {
  accuracy: number;
  averageScore: number;
  averageReaction: number | null;
}

export function derivePlayerStats(input: PlayerStats): DerivedPlayerStats {
  const s = normalizePlayerStats(input);
  const attempts = s.totalTaps + s.totalMistakes;
  return {
    accuracy: attempts > 0 ? Math.min(1, s.totalTaps / attempts) : 0,
    averageScore: s.totalGames > 0 ? s.totalScore / s.totalGames : 0,
    averageReaction:
      s.reactionSamples > 0 ? Math.round(s.totalReactionTime / s.reactionSamples) : null,
  };
}
