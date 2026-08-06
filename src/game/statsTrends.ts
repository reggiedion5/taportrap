/**
 * Trend maths for the statistics screen. Pure, cheap, and never run during
 * active gameplay. Every helper is division-by-zero safe.
 */

import { localDateString } from "./daily";
import type { Difficulty } from "./difficulty";
import type { DailyAggregate, RunHistoryEntry } from "./phase3Types";

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

/** Oldest → newest, ready to draw. */
export function scoreTrend(history: RunHistoryEntry[], count = 20): number[] {
  return history
    .slice(0, count)
    .map((h) => h.score)
    .reverse();
}

export function reactionTrend(history: RunHistoryEntry[], count = 20): number[] {
  return history
    .slice(0, count)
    .filter((h) => h.avgReaction !== null)
    .map((h) => Math.round(h.avgReaction as number))
    .reverse();
}

export function accuracyTrend(history: RunHistoryEntry[], count = 20): number[] {
  return history
    .slice(0, count)
    .map((h) => Math.round(h.accuracy * 100))
    .reverse();
}

export function comboTrend(history: RunHistoryEntry[], count = 20): number[] {
  return history
    .slice(0, count)
    .map((h) => h.longestCombo)
    .reverse();
}

export function countBy<K extends string>(
  history: RunHistoryEntry[],
  key: (entry: RunHistoryEntry) => K,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const entry of history) {
    const k = key(entry);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export function gamesByDifficulty(history: RunHistoryEntry[]): Record<string, number> {
  return countBy(history, (h) => h.difficulty);
}

export function gamesByBoard(history: RunHistoryEntry[]): Record<string, number> {
  return countBy(history, (h) => h.boardId);
}

export function bestScoreByDifficulty(history: RunHistoryEntry[]): Record<Difficulty, number> {
  const out: Record<Difficulty, number> = { beginner: 0, standard: 0, expert: 0 };
  for (const entry of history) {
    if (entry.difficulty in out) {
      out[entry.difficulty] = Math.max(out[entry.difficulty], entry.score);
    }
  }
  return out;
}

/** Last 7 calendar days of aggregates, oldest → newest. */
export function recentDays(aggregates: DailyAggregate[], days = 7): DailyAggregate[] {
  const sorted = [...aggregates].sort((a, b) => (a.date < b.date ? -1 : 1));
  return sorted.slice(-days);
}

export interface WeekComparison {
  currentAvgScore: number;
  previousAvgScore: number;
  scoreDelta: number;
  currentGames: number;
  previousGames: number;
  currentAvgReaction: number | null;
  previousAvgReaction: number | null;
  reactionDelta: number | null;
  hasComparison: boolean;
}

/** Compares the last 7 days with the 7 days before them. */
export function compareLastSevenDays(
  aggregates: DailyAggregate[],
  today = localDateString(),
): WeekComparison {
  const sorted = [...aggregates].sort((a, b) => (a.date < b.date ? -1 : 1));
  const todayTime = Date.parse(`${today}T00:00:00`);
  const inWindow = (date: string, from: number, to: number) => {
    const t = Date.parse(`${date}T00:00:00`);
    if (!Number.isFinite(t)) return false;
    const days = Math.round((todayTime - t) / 86_400_000);
    return days >= from && days < to;
  };

  const current = sorted.filter((a) => inWindow(a.date, 0, 7));
  const previous = sorted.filter((a) => inWindow(a.date, 7, 14));

  const avgScore = (rows: DailyAggregate[]) => {
    const games = rows.reduce((sum, r) => sum + r.games, 0);
    if (games === 0) return 0;
    return rows.reduce((sum, r) => sum + r.totalScore, 0) / games;
  };
  const avgReaction = (rows: DailyAggregate[]) => {
    const samples = rows.reduce((sum, r) => sum + r.reactionSamples, 0);
    if (samples === 0) return null;
    return rows.reduce((sum, r) => sum + r.reactionTotal, 0) / samples;
  };

  const currentAvgScore = avgScore(current);
  const previousAvgScore = avgScore(previous);
  const currentAvgReaction = avgReaction(current);
  const previousAvgReaction = avgReaction(previous);

  return {
    currentAvgScore,
    previousAvgScore,
    scoreDelta: currentAvgScore - previousAvgScore,
    currentGames: current.reduce((sum, r) => sum + r.games, 0),
    previousGames: previous.reduce((sum, r) => sum + r.games, 0),
    currentAvgReaction,
    previousAvgReaction,
    reactionDelta:
      currentAvgReaction !== null && previousAvgReaction !== null
        ? currentAvgReaction - previousAvgReaction
        : null,
    hasComparison: previous.length > 0 && current.length > 0,
  };
}

/** Plain-language summary used as the accessible label for every chart. */
export function describeSeries(label: string, values: number[], unit = ""): string {
  if (values.length === 0) return `${label}: no data yet.`;
  const first = values[0];
  const last = values[values.length - 1];
  const best = Math.max(...values);
  const avg = Math.round(average(values));
  const direction = last > first ? "up" : last < first ? "down" : "flat";
  return `${label}: ${values.length} entries, latest ${Math.round(last)}${unit}, best ${best}${unit}, average ${avg}${unit}, trending ${direction}.`;
}
