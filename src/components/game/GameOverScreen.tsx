import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { MODE_CONFIG } from "@/game/modes";
import { GAME_OVER_HEADLINE, GAME_OVER_MESSAGE } from "@/game/types";
import type { PersonalRecordKey } from "@/game/progressionTypes";
import type { SessionSummary } from "@/game/useProgress";
import { formatShareText, shareResult } from "@/game/share";
import { formatMsValue } from "@/game/format";
import { ArcadeBackdrop } from "./ArcadeBackdrop";
import { XpProgressBar } from "./XpProgressBar";

interface GameOverScreenProps {
  summary: SessionSummary;
  levelCurrentXp: number;
  levelXpForNext: number;
  dailyObjective: string;
  reducedMotion: boolean;
  onPlayAgain: () => void;
  onChangeMode: () => void;
  onMenu: () => void;
}

const STAGE_DELAYS = [450, 500, 550, 550];

export function GameOverScreen({
  summary,
  levelCurrentXp,
  levelXpForNext,
  dailyObjective,
  reducedMotion,
  onPlayAgain,
  onChangeMode,
  onMenu,
}: GameOverScreenProps) {
  const { result } = summary;
  const config = MODE_CONFIG[result.mode];
  const [stage, setStage] = useState(reducedMotion ? 4 : 0);
  const [shareNote, setShareNote] = useState<string | null>(null);

  useEffect(() => {
    if (reducedMotion || stage >= 4) return;
    const id = window.setTimeout(
      () => setStage((s) => Math.min(4, s + 1)),
      STAGE_DELAYS[stage] ?? 500,
    );
    return () => window.clearTimeout(id);
  }, [stage, reducedMotion]);

  const has = (key: PersonalRecordKey) => summary.newRecords.includes(key);
  const showReason = result.reason !== null && !(result.mode === "blitz" && result.reason === null);

  return (
    <div
      className="no-select safe-area relative min-h-[100dvh] overflow-hidden"
      onClick={() => setStage(4)}
    >
      <ArcadeBackdrop />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col justify-center px-5 py-8">
        <p className="sticker-sm text-center text-[11px] tracking-[0.3em] text-arcade-text/80">
          {config.name.toUpperCase()} MODE
        </p>
        <h1 className="mt-2 text-center text-[clamp(38px,12vw,62px)] leading-none">
          <span
            className={`sticker-text text-neon-red glow-red ${reducedMotion ? "" : "animate-slam"}`}
          >
            {result.reason ? GAME_OVER_HEADLINE[result.reason] : config.overTitle.toUpperCase()}
          </span>
        </h1>
        {showReason && result.reason && (
          <p className="mt-3 text-center text-base font-black tracking-tight text-arcade-text">
            {GAME_OVER_MESSAGE[result.reason]}
          </p>
        )}

        <div className="arcade-panel mt-5 p-5 text-center">
          <p className="sticker-sm text-[11px] tracking-[0.25em] text-arcade-text/80">
            FINAL SCORE
          </p>
          <p className="sticker-text text-7xl leading-none text-neon-gold glow-gold tabular-nums">
            {result.score}
          </p>
          <p className="sticker-sm mt-1 text-[11px] tracking-[0.18em] text-arcade-text/85">
            {config.name.toUpperCase()} BEST {summary.modeHighScore}
          </p>
          {has("score") && <Badge label="NEW BEST" />}

          {stage >= 1 && (
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Stat label="BEST COMBO" value={`${result.bestCombo}x`} isRecord={has("bestCombo")} />
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
          )}
        </div>

        {stage >= 2 && (
          <div className="arcade-panel mt-4 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="sticker-sm text-[11px] tracking-[0.2em] text-arcade-text/80">
                XP EARNED
              </span>
              <span className="sticker-sm text-2xl text-neon-green glow-green tabular-nums">
                +{summary.xp.total}
              </span>
            </div>
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
            <div className="mt-4">
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
                className={`sticker-text mt-3 text-center text-3xl text-neon-gold glow-gold ${reducedMotion ? "" : "animate-slam"}`}
                aria-live="polite"
              >
                LEVEL UP! {summary.levelBefore} → {summary.levelAfter}
              </p>
            )}
          </div>
        )}

        {stage >= 3 && (
          <div className="mt-4 grid gap-3">
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

            {summary.mission && (
              <div className="arcade-panel p-4">
                <p className="sticker-sm text-[10px] tracking-[0.22em] text-arcade-text/80">
                  NEXT RUN MISSION
                </p>
                <p className="mt-1 text-sm font-black text-arcade-text">{summary.mission.label}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 grid gap-3 pb-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlayAgain();
            }}
            className="arcade-btn sticker-sm w-full bg-neon-green py-5 text-2xl tracking-tight text-arcade-bg-deep shadow-[0_0_40px_-8px_var(--neon-green)]"
          >
            Play Again →
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChangeMode();
              }}
              className="arcade-btn sticker-sm border border-arcade-line bg-arcade-surface py-4 text-sm text-arcade-text"
            >
              Change Mode
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMenu();
              }}
              className="arcade-btn sticker-sm border border-arcade-line bg-arcade-surface py-4 text-sm text-arcade-text"
            >
              Main Menu
            </button>
          </div>
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              const outcome = await shareResult(formatShareText(result));
              setShareNote(
                outcome === "copied"
                  ? "Result copied"
                  : outcome === "shared"
                    ? "Shared"
                    : "Sharing unavailable",
              );
              window.setTimeout(() => setShareNote(null), 2000);
            }}
            className="arcade-btn sticker-sm flex items-center justify-center gap-2 border border-arcade-line bg-arcade-surface py-4 text-sm text-arcade-text"
          >
            <Share2 className="size-4" aria-hidden /> Share Result
          </button>
          {shareNote && (
            <p
              className="sticker-sm text-center text-xs tracking-[0.16em] text-neon-green glow-green"
              aria-live="polite"
            >
              {shareNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return <p className="sticker-sm shimmer-text mt-2 text-sm tracking-[0.2em]">{label}</p>;
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
      className={`rounded-2xl border bg-arcade-surface/70 px-2 py-3 ${
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
