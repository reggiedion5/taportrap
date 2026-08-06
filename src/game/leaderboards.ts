/**
 * On-device local records ("Your Local Records").
 *
 * These are the player's own saved runs only — there is no online component,
 * no other players, and no network access of any kind.
 */

import { localDateString } from "./daily";
import { weekKeyFor, weekKeyForDate } from "./weeklyChallenges";
import { LIMITS, type RunHistoryEntry } from "./phase3Types";

export type LeaderboardCategory =
  "all" | "today" | "week" | "month" | "beginner" | "standard" | "expert" | "board";

export const LEADERBOARD_LABEL: Record<LeaderboardCategory, string> = {
  all: "All Time",
  today: "Today",
  week: "This Week",
  month: "This Month",
  beginner: "Beginner",
  standard: "Standard",
  expert: "Expert",
  board: "By Board",
};

export interface LeaderboardEntry extends RunHistoryEntry {
  rank: number;
  isBest: boolean;
}

function matches(
  entry: RunHistoryEntry,
  category: LeaderboardCategory,
  today: string,
  boardId: string | null,
): boolean {
  const date = localDateString(new Date(entry.timestamp));
  switch (category) {
    case "today":
      return date === today;
    case "week":
      return weekKeyForDate(date) === weekKeyFor(new Date(`${today}T00:00:00`));
    case "month":
      return date.slice(0, 7) === today.slice(0, 7);
    case "beginner":
    case "standard":
    case "expert":
      return entry.difficulty === category;
    case "board":
      return boardId === null || entry.boardId === boardId;
    default:
      return true;
  }
}

/**
 * Score descending, newest first on a tie, de-duplicated by run id and capped
 * at 25 entries.
 */
export function buildLeaderboard(
  history: RunHistoryEntry[],
  category: LeaderboardCategory = "all",
  boardId: string | null = null,
  today = localDateString(),
): LeaderboardEntry[] {
  const seen = new Set<string>();
  const rows = history.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return matches(entry, category, today, boardId);
  });

  rows.sort((a, b) => (b.score !== a.score ? b.score - a.score : b.timestamp - a.timestamp));
  const top = rows.slice(0, LIMITS.leaderboardEntries);
  return top.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    isBest: index === 0 && entry.score > 0,
  }));
}

export function leaderboardBoards(history: RunHistoryEntry[]): string[] {
  return Array.from(new Set(history.map((h) => h.boardId).filter(Boolean))).sort();
}
