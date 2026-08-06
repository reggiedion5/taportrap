/**
 * Run history and daily aggregates.
 *
 * Only *completed* competitive runs are stored, capped at 100 records, with a
 * rolling 90-day aggregate for trends. Lifetime totals live in the Phase 1
 * statistics store and are never duplicated here.
 */

import { localDateString } from "./daily";
import { levelForScore, type Difficulty } from "./difficulty";
import { LIMITS, type DailyAggregate, type RunHistoryEntry } from "./phase3Types";
import type { GameSessionResult } from "./progressionTypes";

export interface RunHistoryInput {
  result: GameSessionResult;
  difficulty: Difficulty;
  boardId: string;
  xpEarned: number;
  newBest: boolean;
  timestamp?: number;
}

/** Mistakes = the tap that ended the run. Quitting is not a mistake. */
function mistakesFor(result: GameSessionResult): number {
  return result.reason && result.reason !== "quit" ? 1 : 0;
}


export function buildRunEntry(input: RunHistoryInput): RunHistoryEntry {
  const { result } = input;
  const s = result.stats;
  const correct = Math.max(0, s.successes);
  const mistakes = mistakesFor(result);
  const attempts = correct + mistakes;
  return {
    id: result.sessionId,
    timestamp: input.timestamp ?? Date.now(),
    mode: result.mode,
    score: Math.max(0, Math.round(result.score)),
    difficulty: input.difficulty,
    boardId: input.boardId,
    correct,
    mistakes,
    accuracy: attempts > 0 ? correct / attempts : 0,
    longestCombo: Math.max(0, result.bestCombo),
    perfect: Math.max(0, s.perfect),
    great: Math.max(0, s.great ?? 0),
    closeCalls: Math.max(0, s.closeCalls ?? 0),
    avgReaction: s.avgReaction,
    fastestReaction: s.fastestReaction,
    durationMs: Math.max(0, result.durationMs),
    xpEarned: Math.max(0, Math.round(input.xpEarned)),
    newBest: input.newBest,
    tier: levelForScore(result.score).level,
  };
}

/** Newest first, de-duplicated by session id, capped at the storage limit. */
export function appendRun(
  history: RunHistoryEntry[],
  entry: RunHistoryEntry,
): RunHistoryEntry[] {
  if (history.some((h) => h.id === entry.id)) return history;
  return [entry, ...history].slice(0, LIMITS.runHistory);
}

export function emptyAggregate(date: string): DailyAggregate {
  return {
    date,
    games: 0,
    totalScore: 0,
    bestScore: 0,
    correct: 0,
    mistakes: 0,
    perfect: 0,
    xp: 0,
    reactionTotal: 0,
    reactionSamples: 0,
  };
}

/** Folds a run into the day bucket, trimming to the most recent 90 days. */
export function appendAggregate(
  aggregates: DailyAggregate[],
  entry: RunHistoryEntry,
  date = localDateString(new Date(entry.timestamp)),
): DailyAggregate[] {
  const existing = aggregates.find((a) => a.date === date) ?? emptyAggregate(date);
  const samples = entry.avgReaction !== null ? entry.correct : 0;
  const updated: DailyAggregate = {
    ...existing,
    games: existing.games + 1,
    totalScore: existing.totalScore + entry.score,
    bestScore: Math.max(existing.bestScore, entry.score),
    correct: existing.correct + entry.correct,
    mistakes: existing.mistakes + entry.mistakes,
    perfect: existing.perfect + entry.perfect,
    xp: existing.xp + entry.xpEarned,
    reactionTotal: existing.reactionTotal + (entry.avgReaction ?? 0) * samples,
    reactionSamples: existing.reactionSamples + samples,
  };
  return [updated, ...aggregates.filter((a) => a.date !== date)]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, LIMITS.dailyAggregates);
}

/* ---------------- favourites ---------------- */

/** Ties break on the alphabetically first id so the result is deterministic. */
function mostFrequent(values: string[]): string | null {
  if (values.length === 0) return null;
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  let best: string | null = null;
  let bestCount = -1;
  for (const [key, count] of Array.from(counts.entries()).sort((a, b) =>
    a[0] < b[0] ? -1 : 1,
  )) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

export function favoriteDifficulty(history: RunHistoryEntry[]): Difficulty | null {
  return (mostFrequent(history.map((h) => h.difficulty)) as Difficulty | null) ?? null;
}

export function mostUsedBoard(history: RunHistoryEntry[]): string | null {
  return mostFrequent(history.map((h) => h.boardId).filter(Boolean));
}
