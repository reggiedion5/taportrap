import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { MODE_CONFIG } from "@/game/modes";
import { GAME_OVER_HEADLINE, GAME_OVER_MESSAGE } from "@/game/types";
import type { PersonalRecordKey } from "@/game/progressionTypes";
import type { SessionSummary } from "@/game/useProgress";
import { emptyShareData, type ShareResultData } from "@/game/shareResult";
import { formatMsValue } from "@/game/format";
import { ArcadeBackdrop } from "./ArcadeBackdrop";
import { XpProgressBar } from "./XpProgressBar";
import { ShareButton } from "./ShareButton";

interface GameOverScreenProps {
  summary: SessionSummary;
  levelCurrentXp: number;
  levelXpForNext: number;
  dailyObjective: string;
  playerLevel: number;
  reducedMotion: boolean;
  onPlayAgain: () => void;
  onChangeMode: () => void;
  onMenu: () => void;
}

const STAGE_DELAYS = [420, 480, 520];

/**
 * Hierarchy, top to bottom: outcome → score → what to do next → everything
 * else. Rewards and run details are secondary and never push the primary
 * action below the fold.
 */
export function GameOverScreen({
  summary,
  levelCurrentXp,
  levelXpForNext,
  dailyObjective,
  playerLevel,
  reducedMotion,
  onPlayAgain,
  onChangeMode,
  onMenu,
}: GameOverScreenProps) {
  const { result } = summary;
  const config = MODE_CONFIG[result.mode];
  const [stage, setStage] = useState(reducedMotion ? 3 : 0);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (reducedMotion || stage >= 3) return;
    const id = window.setTimeout(
      () => setStage((s) => Math.min(3, s + 1)),
      STAGE_DELAYS[stage] ?? 480,
    );
    return () => window.clearTimeout(id);
  }, [stage, reducedMotion]);

  const has = (key: PersonalRecordKey) => summary.newRecords.includes(key);

  const share: ShareResultData = {
    ...emptyShareData(result.mode),
    score: result.score,
    combo: result.bestCombo,
    averageReaction: result.stats.avgReaction,
    sessionDuration: result.durationMs,
    successes: result.stats.successes,
    personalBest: has("score"),
    playerLevel,
  };

  const highlights = [
    summary.unlockedAchievements.length > 0
      ? `${summary.unlockedAchievements.length} achievement${summary.unlockedAchievements.length > 1 ? "s" : ""}`
      : null,
    summary.unlockedThemes.length > 0 ? "New theme" : null,
    summary.dailyProgress?.completed ? "Daily done" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="no-select safe-area relative min-h-[100dvh] overflow-hidden">
      <ArcadeBackdrop />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col justify-center px-5 py-8">
        {/* ---- 1. outcome ---- */}
        <p className="sticker-sm text-center text-[11px] tracking-[0.3em] text-arcade-text/80">
          {config.name.toUpperCase()} MODE
        </p>
        <h1 className="mt-2 text-center text-[clamp(34px,11vw,56px)] leading-none">
          <span
            className={`sticker-text text-neon-red glow-red ${reducedMotion ? "" : "animate-slam"}`}
          >
            {result.reason ? GAME_OVER_HEADLINE[result.reason] : config.overTitle.toUpperCase()}
          </span>
        </h1>
        {result.reason && (
          <p className="mt-2 text-center text-sm font-black tracking-tight text-arcade-text/90">
            {GAME_OVER_MESSAGE[result.reason]}
          </p>
        )}

        {/* ---- 2. score ---- */}
        <div className="arcade-panel mt-4 p-5 text-center">
          <p className="sticker-sm text-[11px] tracking-[0.25em] text-arcade-text/80">
            FINAL SCORE
          </p>
          <p className="sticker-text text-[clamp(56px,20vw,84px)] leading-none text-neon-gold glow-gold tabular-nums">
            {result.score}
          </p>
          <p className="sticker-sm mt-1 text-[11px] tracking-[0.18em] text-arcade-text/85">
            {config.name.toUpperCase()} BEST {summary.modeHighScore}
          </p>
          {has("score") && (
            <p className="sticker-sm shimmer-text mt-2 text-sm tracking-[0.2em]">NEW BEST</p>
          )}
        </div>

        {/* ---- 3. what to do next ---- */}
        <div className="mt-4 grid gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="arcade-btn sticker-sm min-h-16 w-full bg-neon-green py-5 text-2xl tracking-tight text-arcade-bg-deep shadow-[0_0_40px_-8px_var(--neon-green)]"
          >
            Play Again →
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onChangeMode}
              className="arcade-btn sticker-sm min-h-12 border border-arcade-line bg-arcade-surface py-4 text-sm text-arcade-text"
            >
              Change Mode
            </button>
            <button
              type="button"
              onClick={onMenu}
              className="arcade-btn sticker-sm min-h-12 border border-arcade-line bg-arcade-surface py-4 text-sm text-arcade-text"
            >
              Main Menu
            </button>
          </div>
        </div>

        {/* ---- 4. rewards ---- */}
        {stage >= 1 && (
          <div className="arcade-panel mt-4 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="sticker-sm text-[11px] tracking-[0.2em] text-arcade-text/80">
                XP EARNED
              </span>
              <span className="sticker-sm text-2xl text-neon-green glow-green tabular-nums">
                +{summary.xp.total}
              </span>
            </div>
            <div className="mt-3">
              <XpProgressBar
                level={summary.levelAfter}
                currentXp={levelCurrentXp}
                xpForNext={levelXpForNext}
                animate
                reducedMotion={reducedMotion}
              />
            </div>
            {summary.levelsGained > 0 && (
              <p
                className={`sticker-text mt-3 text-center text-2xl text-neon-gold glow-gold ${reducedMotion ? "" : "animate-slam"}`}
                aria-live="polite"
              >
                LEVEL UP! {summary.levelBefore} → {summary.levelAfter}
              </p>
            )}
            {highlights.length > 0 && (
              <p className="sticker-sm mt-3 text-center text-[11px] tracking-[0.16em] text-neon-purple glow-purple">
                {highlights.join(" · ")}
              </p>
            )}
          </div>
        )}

        {/* ---- 5. details on demand ---- */}
        {stage >= 2 && (
          <div className="mt-4">
            <button
              type="button"
              aria-expanded={detailsOpen}
              onClick={() => setDetailsOpen((v) => !v)}
              className="arcade-btn sticker-sm flex min-h-12 w-full items-center justify-center gap-2 border border-arcade-line bg-arcade-surface py-3 text-xs tracking-[0.18em] text-arcade-text"
            >
              {detailsOpen ? "Hide run details" : "Run details"}
              <ChevronDown
                className={`size-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            {detailsOpen && (
              <div className="mt-3 grid gap-3">
                <div className="arcade-panel grid grid-cols-3 gap-3 p-4">
                  <Stat
                    label="BEST COMBO"
                    value={`${result.bestCombo}x`}
                    isRecord={has("bestCombo")}
                  />
                  <Stat
                    label="AVG REACT"
                    value={formatMsValue(result.stats.avgReaction)}
                    isRecord={has("bestAvgReaction")}
                  />
                  <Stat
                    label="FASTEST"
                    value={formatMsValue(result.stats.fastestReaction)}
                    isRecord={has("fastestReaction")}
                  />
                  <Stat
                    label="PERFECT"
                    value={String(result.stats.perfect)}
                    isRecord={has("mostPerfectInRun")}
                  />
                  <Stat label="HITS" value={String(result.stats.successes)} />
                  <Stat
                    label="TRAPS DODGED"
                    value={String(result.stats.trapsAvoided)}
                    isRecord={has("mostTrapsAvoidedInRun")}
                  />
                </div>

                {summary.xp.entries.length > 0 && (
                  <div className="arcade-panel p-4">
                    <p className="sticker-sm text-[10px] tracking-[0.22em] text-arcade-text/80">
                      XP BREAKDOWN
                    </p>
                    <ul className="mt-2 space-y-1">
                      {summary.xp.entries.map((entry) => (
                        <li
                          key={entry.label}
                          className="flex justify-between text-xs font-bold text-arcade-text/85"
                        >
                          <span>{entry.label}</span>
                          <span className="tabular-nums">+{entry.xp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.dailyProgress && (
                  <div className="arcade-panel p-4">
                    <p className="sticker-sm text-[10px] tracking-[0.22em] text-neon-gold glow-gold">
                      DAILY CHALLENGE
                    </p>
                    <p className="mt-1 text-sm font-bold text-arcade-text">{dailyObjective}</p>
                    <p className="sticker-sm mt-1 text-xs tracking-[0.14em] text-arcade-text/85">
                      {summary.dailyProgress.completed
                        ? "COMPLETED · New challenge tomorrow"
                        : `${Math.round(summary.dailyProgress.value)} / ${summary.dailyProgress.target}`}
                    </p>
                  </div>
                )}

                {summary.unlockedAchievements.length > 0 && (
                  <div className="arcade-panel p-4">
                    <p className="sticker-sm text-[10px] tracking-[0.22em] text-neon-purple glow-purple">
                      ACHIEVEMENTS UNLOCKED
                    </p>
                    <ul className="mt-1 space-y-1">
                      {summary.unlockedAchievements.map((a) => (
                        <li key={a.id} className="text-sm font-bold text-arcade-text">
                          {a.title} · +{a.rewardXp} XP
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.unlockedThemes.length > 0 && (
                  <div className="arcade-panel p-4">
                    <p className="sticker-sm text-[10px] tracking-[0.22em] text-neon-green glow-green">
                      THEME UNLOCKED
                    </p>
                    <p className="mt-1 text-sm font-bold text-arcade-text">
                      {summary.unlockedThemes.join(", ")}
                    </p>
                  </div>
                )}

                {summary.missionCompleted && (
                  <div className="arcade-panel border-2 border-neon-green p-4">
                    <p className="sticker-sm text-[10px] tracking-[0.22em] text-neon-green glow-green">
                      MISSION COMPLETE
                    </p>
                    <p className="mt-1 text-sm font-bold text-arcade-text">
                      {summary.missionCompleted.label}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {stage >= 3 && summary.mission && (
          <div className="arcade-panel mt-4 p-4">
            <p className="sticker-sm text-[10px] tracking-[0.22em] text-arcade-text/80">
              NEXT RUN MISSION
            </p>
            <p className="mt-1 text-sm font-black text-arcade-text">{summary.mission.label}</p>
          </div>
        )}

        <div className="mt-4 pb-2">
          <ShareButton data={share} />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  isRecord = false,
}: {
  label: string;
  value: string;
  isRecord?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-arcade-surface/70 px-2 py-3 text-center ${
        isRecord ? "border-neon-gold" : "border-arcade-line"
      }`}
    >
      <p className="sticker-sm text-[9px] tracking-[0.16em] text-arcade-text/75">{label}</p>
      <p className="sticker-sm mt-1 text-lg text-arcade-text tabular-nums">{value}</p>
      {isRecord && (
        <p className="sticker-sm mt-1 text-[8px] tracking-[0.18em] text-neon-gold glow-gold">
          NEW BEST
        </p>
      )}
    </div>
  );
}
