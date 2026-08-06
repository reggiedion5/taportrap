import { useState } from "react";
import { GAME_MODES, MODE_CONFIG } from "@/game/modes";
import { GAME_OVER_HEADLINE } from "@/game/types";
import type {
  DailyState,
  PersonalRecords,
  PlayerLevel,
  PlayerStatistics,
} from "@/game/progressionTypes";
import { formatAverage, formatCount, formatMsValue, formatPlayTime } from "@/game/format";
import type { DailyAggregate, RunHistoryEntry } from "@/game/phase3Types";
import {
  accuracyTrend,
  average,
  comboTrend,
  compareLastSevenDays,
  gamesByDifficulty,
  reactionTrend,
  scoreTrend,
} from "@/game/statsTrends";
import { Sparkline } from "./Sparkline";
import { Sheet } from "./Sheet";
import { ConfirmationModal } from "./ConfirmationModal";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-arcade-line bg-arcade-surface/70 px-3 py-3">
      <p className="sticker-sm text-[11px] tracking-[0.12em] text-arcade-muted">{label}</p>
      <p className="sticker-sm mt-1 text-lg text-arcade-text tabular-nums">{value}</p>
    </div>
  );
}

interface StatisticsScreenProps {
  open: boolean;
  history: RunHistoryEntry[];
  aggregates: DailyAggregate[];
  statistics: PlayerStatistics;
  records: PersonalRecords;
  daily: DailyState;
  level: PlayerLevel;
  lifetimeXp: number;
  onReset: () => void;
  onClearHistory: () => void;
  onClose: () => void;
}

export function StatisticsScreen({
  open,
  history,
  aggregates,
  statistics,
  records,
  daily,
  level,
  lifetimeXp,
  onReset,
  onClearHistory,
  onClose,
}: StatisticsScreenProps) {
  const [clearing, setClearing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const highestOverall = Math.max(...GAME_MODES.map((m) => records.highScore[m]), 0);

  const scores = scoreTrend(history);
  const reactions = reactionTrend(history);
  const accuracies = accuracyTrend(history);
  const combos = comboTrend(history);
  const week = compareLastSevenDays(aggregates);
  const byDifficulty = gamesByDifficulty(history);
  const consistency = accuracies.length > 1
    ? Math.round(
        100 -
          Math.min(
            100,
            Math.sqrt(
              accuracies.reduce((sum, v) => sum + (v - average(accuracies)) ** 2, 0) /
                accuracies.length,
            ),
          ),
      )
    : null;

  return (
    <Sheet open={open} title="Statistics" onClose={onClose}>
      <section aria-label="Recent form">
        <h3 className="sticker-sm text-[11px] tracking-[0.26em] text-arcade-text/80">
          RECENT FORM
        </h3>
        {history.length === 0 ? (
          <p className="ui-body mt-3 text-[15px] text-arcade-muted">
            Play a few runs and your trends will appear here.
          </p>
        ) : (
          <>
            <div className="mt-3 grid gap-4">
              <Sparkline label="Score (last 20 runs)" values={scores} tone="green" />
              <Sparkline
                label="Average reaction"
                values={reactions}
                unit="ms"
                tone="gold"
                invert
              />
              <Sparkline label="Accuracy" values={accuracies} unit="%" tone="purple" />
              <Sparkline label="Longest combo" values={combos} tone="green" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat
                label="THIS WEEK AVG"
                value={week.currentGames > 0 ? String(Math.round(week.currentAvgScore)) : "—"}
              />
              <Stat
                label="VS LAST WEEK"
                value={
                  week.hasComparison
                    ? `${week.scoreDelta >= 0 ? "+" : ""}${Math.round(week.scoreDelta)}`
                    : "—"
                }
              />
              <Stat label="GAMES THIS WEEK" value={String(week.currentGames)} />
              <Stat label="CONSISTENCY" value={consistency !== null ? `${consistency}%` : "—"} />
              <Stat label="BEGINNER RUNS" value={String(byDifficulty.beginner ?? 0)} />
              <Stat label="STANDARD RUNS" value={String(byDifficulty.standard ?? 0)} />
              <Stat label="EXPERT RUNS" value={String(byDifficulty.expert ?? 0)} />
              <Stat label="RUNS SAVED" value={String(history.length)} />
            </div>
          </>
        )}
      </section>

      <section className="mt-7" aria-label="Lifetime summary">
        <h3 className="sticker-sm text-[11px] tracking-[0.26em] text-arcade-text/80">LIFETIME</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Stat label="GAMES PLAYED" value={formatCount(statistics.gamesPlayed)} />
          <Stat label="TOTAL SCORE" value={formatCount(statistics.totalScore)} />
          <Stat
            label="HIGHEST SCORE"
            value={highestOverall > 0 ? formatCount(highestOverall) : "—"}
          />
          <Stat label="BEST COMBO" value={formatCount(statistics.bestCombo)} />
          <Stat label="SUCCESSFUL HITS" value={formatCount(statistics.totalSuccessfulReactions)} />
          <Stat
            label="AVG REACTION"
            value={formatAverage(statistics.totalReactionTime, statistics.reactionSampleCount)}
          />
          <Stat label="FASTEST REACTION" value={formatMsValue(statistics.fastestReaction)} />
          <Stat label="PERFECT" value={formatCount(statistics.perfectCount)} />
          <Stat label="FAST" value={formatCount(statistics.fastCount)} />
          <Stat label="GOOD" value={formatCount(statistics.goodCount)} />
          <Stat label="GOLD COLLECTED" value={formatCount(statistics.totalGold)} />
          <Stat label="TRAPS AVOIDED" value={formatCount(statistics.totalTrapsAvoided)} />
          <Stat label="PURPLE DONE" value={formatCount(statistics.totalPurpleCompletions)} />
          <Stat label="PLAY TIME" value={formatPlayTime(statistics.totalPlayTime)} />
          <Stat label="LEVEL" value={formatCount(level.level)} />
          <Stat label="LIFETIME XP" value={formatCount(lifetimeXp)} />
          <Stat label="DAILIES DONE" value={formatCount(daily.totalCompleted)} />
          <Stat label="DAILY STREAK" value={formatCount(daily.currentStreak)} />
          <Stat label="BEST STREAK" value={formatCount(daily.bestStreak)} />
        </div>
      </section>

      {GAME_MODES.map((mode) => {
        const s = statistics.modes[mode];
        const config = MODE_CONFIG[mode];
        const topReason = Object.entries(s.overReasons).sort((a, b) => b[1] - a[1])[0];
        return (
          <section key={mode} className="mt-7" aria-label={`${config.name} statistics`}>
            <h3 className="sticker-sm text-[11px] tracking-[0.26em] text-arcade-text/80">
              {config.name.toUpperCase()}
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Stat label="GAMES" value={formatCount(s.gamesPlayed)} />
              <Stat label="HIGH SCORE" value={s.gamesPlayed ? formatCount(s.highScore) : "—"} />
              <Stat label="BEST COMBO" value={formatCount(s.bestCombo)} />
              <Stat
                label="AVG REACTION"
                value={formatAverage(s.totalReactionTime, s.reactionSampleCount)}
              />
              {mode === "blitz" && (
                <>
                  <Stat
                    label="AVG SCORE"
                    value={
                      s.gamesPlayed ? formatCount(Math.round(s.totalScore / s.gamesPlayed)) : "—"
                    }
                  />
                  <Stat label="BEST RUN HITS" value={formatCount(s.longestRun)} />
                </>
              )}
              {mode === "survival" && (
                <Stat label="LONGEST RUN" value={formatCount(s.longestRun)} />
              )}
              {mode === "focus" && (
                <>
                  <Stat label="BEST AVG" value={formatMsValue(s.bestAvgReaction)} />
                  <Stat label="FASTEST HIT" value={formatMsValue(s.fastestReaction)} />
                  <Stat label="MOST PERFECT" value={formatCount(s.bestPerfectInRun)} />
                </>
              )}
              {mode === "classic" && (
                <Stat
                  label="COMMON ENDING"
                  value={
                    topReason
                      ? (GAME_OVER_HEADLINE[topReason[0] as keyof typeof GAME_OVER_HEADLINE] ?? "—")
                      : "—"
                  }
                />
              )}
              <Stat label="PLAY TIME" value={formatPlayTime(s.totalPlayTime)} />
            </div>
          </section>
        );
      })}

      <button
        type="button"
        onClick={() => setClearing(true)}
        className="arcade-btn ui-title mt-8 min-h-12 w-full border border-arcade-line bg-arcade-surface py-4 text-base text-arcade-text"
      >
        Clear Run History
      </button>

      <ConfirmationModal
        open={clearing}
        title="Clear Run History?"
        body="This clears local trend data only."
        bullets={[
          "Recent runs, trend charts and local records",
          "Streaks, titles, badges and lifetime stats are kept",
        ]}
        confirmLabel="Clear History"
        onConfirm={() => {
          onClearHistory();
          setClearing(false);
        }}
        onCancel={() => setClearing(false)}
      />

      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="arcade-btn ui-title mt-3 min-h-12 w-full border border-neon-red bg-arcade-surface py-4 text-base text-neon-red"
      >
        Reset Statistics
      </button>

      <ConfirmationModal
        open={confirming}
        title="Reset Statistics?"
        body="This permanently deletes your local progress data."
        bullets={[
          "All lifetime and per-mode statistics",
          "All personal records and high scores",
          "All unlocked achievements",
          "Settings, selected theme and tutorial progress are kept",
        ]}
        confirmLabel="Reset Statistics"
        doubleConfirm
        onConfirm={() => {
          onReset();
          setConfirming(false);
        }}
        onCancel={() => setConfirming(false)}
      />
    </Sheet>
  );
}
