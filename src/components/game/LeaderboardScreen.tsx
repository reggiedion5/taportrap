import { Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { boardById } from "@/game/boards";
import { DIFFICULTY_PRESETS } from "@/game/difficulty";
import { MODE_CONFIG } from "@/game/modes";
import {
  LEADERBOARD_LABEL,
  buildLeaderboard,
  type LeaderboardCategory,
} from "@/game/leaderboards";
import type { RunHistoryEntry } from "@/game/phase3Types";
import { Sheet } from "./Sheet";
import { ChromeCard } from "./ArcUI";

const CATEGORIES: LeaderboardCategory[] = [
  "all",
  "today",
  "week",
  "month",
  "beginner",
  "standard",
  "expert",
];

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

interface LeaderboardScreenProps {
  open: boolean;
  history: RunHistoryEntry[];
  onClose: () => void;
}

/** Your own saved runs, on this device. There is no online leaderboard. */
export function LeaderboardScreen({ open, history, onClose }: LeaderboardScreenProps) {
  const [category, setCategory] = useState<LeaderboardCategory>("all");
  const rows = useMemo(() => buildLeaderboard(history, category), [history, category]);

  return (
    <Sheet open={open} title="Your Local Records" onClose={onClose}>
      <p className="ui-body text-[15px] text-arcade-muted">
        Your best runs, saved on this device. Nothing is uploaded or shared.
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Record filters">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={category === c}
            onClick={() => setCategory(c)}
            className={`ui-title rounded-full px-3 py-2 text-[11px] tracking-[0.16em] ${
              category === c
                ? "bg-logo-green text-arcade-bg-deep"
                : "bg-arcade-surface text-arcade-muted"
            }`}
          >
            {LEADERBOARD_LABEL[c].toUpperCase()}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <ChromeCard faceClassName="mt-4 p-5 text-center">
          <Trophy className="mx-auto size-6 text-arcade-muted" aria-hidden />
          <p className="ui-body mt-2 text-[15px] text-arcade-muted">
            No runs in this filter yet. Play a game to set your first record.
          </p>
        </ChromeCard>
      ) : (
        <ol className="mt-4 grid gap-2.5">
          {rows.map((row) => (
            <li key={row.id}>
              <ChromeCard faceClassName="flex items-center gap-3 px-4 py-3">
                <span
                  className={`ui-title w-7 shrink-0 text-[13px] tabular-nums ${
                    row.isBest ? "text-neon-gold glow-gold" : "text-arcade-muted"
                  }`}
                >
                  {row.rank}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="ui-body-tight block text-[15px] font-bold text-arcade-text">
                    {row.score} pts
                  </span>
                  <span className="ui-body block text-[13px] text-arcade-muted">
                    {MODE_CONFIG[row.mode].name} ·{" "}
                    {DIFFICULTY_PRESETS[row.difficulty]?.label ?? row.difficulty} ·{" "}
                    {boardById(row.boardId).name} · {formatDate(row.timestamp)}
                  </span>
                </span>
                <span className="ui-title shrink-0 text-[11px] tracking-[0.14em] text-arcade-muted tabular-nums">
                  x{row.longestCombo}
                </span>
              </ChromeCard>
            </li>
          ))}
        </ol>
      )}
    </Sheet>
  );
}
