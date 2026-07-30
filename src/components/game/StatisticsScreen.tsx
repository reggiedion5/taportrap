import { useState } from "react";
import { GAME_MODES, MODE_CONFIG } from "@/game/modes";
import { GAME_OVER_HEADLINE } from "@/game/types";
import type {
  DailyState,
  PersonalRecords,
  PlayerLevel,
  PlayerStatistics,
} from "@/game/progressionTypes";
import {
  formatAverage,
  formatCount,
  formatMsValue,
  formatPlayTime,
} from "@/game/format";
import { Sheet } from "./Sheet";
import { ConfirmationModal } from "./ConfirmationModal";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-arcade-line bg-arcade-surface/70 px-3 py-3">
      <p className="sticker-sm text-[9px] tracking-[0.16em] text-arcade-text/75">
        {label}
      </p>
      <p className="sticker-sm mt-1 text-lg text-arcade-text tabular-nums">
        {value}
      </p>
    </div>
  );
}

interface StatisticsScreenProps {
  open: boolean;
  statistics: PlayerStatistics;
  records: PersonalRecords;
  daily: DailyState;
  level: PlayerLevel;
  lifetimeXp: number;
  onReset: () => void;
  onClose: () => void;
}

export function StatisticsScreen({
  open,
  statistics,
  records,
  daily,
  level,
  lifetimeXp,
  onReset,
  onClose,
}: StatisticsScreenProps) {
  const [confirming, setConfirming] = useState(false);

  const highestOverall = Math.max(
    ...GAME_MODES.map((m) => records.highScore[m]),
    0,
  );

  return (
    <Sheet open={open} title="Statistics" onClose={onClose}>
      <section aria-label="Lifetime summary">
        <h3 className="sticker-sm text-[11px] tracking-[0.26em] text-arcade-text/80">
          LIFETIME
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Stat label="GAMES PLAYED" value={formatCount(statistics.gamesPlayed)} />
          <Stat label="TOTAL SCORE" value={formatCount(statistics.totalScore)} />
          <Stat
            label="HIGHEST SCORE"
            value={highestOverall > 0 ? formatCount(highestOverall) : "—"}
          />
          <Stat label="BEST COMBO" value={formatCount(statistics.bestCombo)} />
          <Stat
            label="SUCCESSFUL HITS"
            value={formatCount(statistics.totalSuccessfulReactions)}
          />
          <Stat
            label="AVG REACTION"
            value={formatAverage(
              statistics.totalReactionTime,
              statistics.reactionSampleCount,
            )}
          />
          <Stat
            label="FASTEST REACTION"
            value={formatMsValue(statistics.fastestReaction)}
          />
          <Stat label="PERFECT" value={formatCount(statistics.perfectCount)} />
          <Stat label="FAST" value={formatCount(statistics.fastCount)} />
          <Stat label="GOOD" value={formatCount(statistics.goodCount)} />
          <Stat label="GOLD COLLECTED" value={formatCount(statistics.totalGold)} />
          <Stat
            label="TRAPS AVOIDED"
            value={formatCount(statistics.totalTrapsAvoided)}
          />
          <Stat
            label="PURPLE DONE"
            value={formatCount(statistics.totalPurpleCompletions)}
          />
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
        const topReason = Object.entries(s.overReasons).sort(
          (a, b) => b[1] - a[1],
        )[0];
        return (
          <section key={mode} className="mt-7" aria-label={`${config.name} statistics`}>
            <h3 className="sticker-sm text-[11px] tracking-[0.26em] text-arcade-text/80">
              {config.name.toUpperCase()}
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Stat label="GAMES" value={formatCount(s.gamesPlayed)} />
              <Stat
                label="HIGH SCORE"
                value={s.gamesPlayed ? formatCount(s.highScore) : "—"}
              />
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
                      s.gamesPlayed
                        ? formatCount(Math.round(s.totalScore / s.gamesPlayed))
                        : "—"
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
                  <Stat
                    label="BEST AVG"
                    value={formatMsValue(s.bestAvgReaction)}
                  />
                  <Stat
                    label="FASTEST HIT"
                    value={formatMsValue(s.fastestReaction)}
                  />
                  <Stat
                    label="MOST PERFECT"
                    value={formatCount(s.bestPerfectInRun)}
                  />
                </>
              )}
              {mode === "classic" && (
                <Stat
                  label="COMMON ENDING"
                  value={
                    topReason
                      ? GAME_OVER_HEADLINE[
                          topReason[0] as keyof typeof GAME_OVER_HEADLINE
                        ] ?? "—"
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
        onClick={() => setConfirming(true)}
        className="arcade-btn sticker-sm mt-8 w-full border border-neon-red bg-arcade-surface py-4 text-base text-neon-red glow-red"
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
