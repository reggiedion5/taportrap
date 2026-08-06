import { useEffect, useState } from "react";
import { ChevronDown, Home, Repeat, Trophy, Zap } from "lucide-react";
import { MODE_CONFIG } from "@/game/modes";
import { GAME_OVER_HEADLINE, GAME_OVER_MESSAGE } from "@/game/types";
import type { PersonalRecordKey } from "@/game/progressionTypes";
import type { SessionSummary } from "@/game/useProgress";
import { emptyShareData, type ShareResultData } from "@/game/shareResult";
import { formatMsValue } from "@/game/format";
import { boardById } from "@/game/boards";
import { ArcadeBackdrop } from "./ArcadeBackdrop";
import { XpProgressBar } from "./XpProgressBar";
import { ShareButton } from "./ShareButton";
import { badgeById, titleById } from "@/game/cosmetics";
import { ArcButton, ChromeCard } from "./ArcUI";

interface GameOverScreenProps {
  summary: SessionSummary;
  difficultyLabel: string;
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
 * Chrome arcade game over: metallic headline over red energy, a chrome score
 * card, then glowing actions. Rewards and details stay secondary.
 */
export function GameOverScreen({
  summary,
  difficultyLabel,
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

  const newTitles = summary.unlockedTitleIds.map((id) => titleById(id).name);
  const newBadges = summary.unlockedBadgeIds.map((id) => badgeById(id).name);

  const highlights = [
    summary.weeklyCompleted.length > 0 ? "Weekly done" : null,
    newTitles.length > 0 ? "New title" : null,
    newBadges.length > 0 ? "New badge" : null,
    summary.unlockedAchievements.length > 0
      ? `${summary.unlockedAchievements.length} achievement${summary.unlockedAchievements.length > 1 ? "s" : ""}`
      : null,
    summary.unlockedBoards.length > 0 ? "New board" : null,
    summary.dailyProgress?.completed ? "Daily done" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="no-select safe-area relative min-h-[100dvh] overflow-hidden">
      <ArcadeBackdrop />
      <div className="animate-screen-in relative mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col justify-center px-5 py-8">
        {/* ---- 1. outcome ---- */}
        <div className="relative">
          {/* red energy behind the title */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-8 h-40 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--logo-red)_38%,transparent),transparent_68%)] blur-xl"
          />
          <p className="ui-title relative text-center text-[11px] tracking-[0.3em] text-arcade-muted">
            {config.name.toUpperCase()} MODE · {difficultyLabel.toUpperCase()}
          </p>
          <h1
            className={`chrome-heading relative mt-1 text-center text-[clamp(38px,13vw,64px)] leading-[0.95] ${
              reducedMotion ? "" : "animate-slam"
            }`}
          >
            {result.reason ? GAME_OVER_HEADLINE[result.reason] : config.overTitle.toUpperCase()}
          </h1>
          {result.reason && (
            <p className="ui-body relative mt-2 text-center text-[15px] font-semibold text-arcade-text">
              {GAME_OVER_MESSAGE[result.reason]}
            </p>
          )}
        </div>

        {/* ---- 2. score ---- */}
        <ChromeCard className="mt-4" faceClassName="p-5 text-center">
          <p className="ui-title text-[11px] tracking-[0.25em] text-arcade-muted">FINAL SCORE</p>
          <p className="score-digits text-[clamp(56px,20vw,84px)] leading-none">{result.score}</p>
          <p className="ui-title mt-1 text-[12px] tracking-[0.18em] text-arcade-muted">
            {config.name.toUpperCase()} · {difficultyLabel.toUpperCase()} BEST {summary.modeHighScore}
          </p>
          {has("score") && (
            <p
              className={`score-digits mt-2 text-lg tracking-[0.2em] ${reducedMotion ? "" : "animate-gold-burst"}`}
            >
              NEW BEST!
            </p>
          )}
        </ChromeCard>

        {/* ---- 3. what to do next ---- */}
        <div className="mt-4 grid gap-3">
          <ArcButton
            tone="green"
            size="lg"
            onClick={onPlayAgain}
            className={reducedMotion ? "" : "animate-glow-pulse"}
            faceClassName="text-2xl tracking-tight"
            icon={<Zap className="size-6 fill-current" aria-hidden />}
          >
            PLAY AGAIN
          </ArcButton>
          <div className="grid grid-cols-2 gap-3">
            <ArcButton
              onClick={onChangeMode}
              icon={<Repeat className="icon-chrome size-4" aria-hidden />}
            >
              Change Mode
            </ArcButton>
            <ArcButton onClick={onMenu} icon={<Home className="icon-chrome size-4" aria-hidden />}>
              Home
            </ArcButton>
          </div>
        </div>

        {/* ---- 4. rewards ---- */}
        {stage >= 1 && (
          <ChromeCard className="mt-4" faceClassName="p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="ui-title text-[11px] tracking-[0.2em] text-arcade-muted">
                XP EARNED
              </span>
              <span className="score-digits text-2xl">+{summary.xp.total}</span>
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
                className={`score-digits mt-3 text-center text-2xl ${reducedMotion ? "" : "animate-gold-burst"}`}
                aria-live="polite"
              >
                LEVEL UP! {summary.levelBefore} → {summary.levelAfter}
              </p>
            )}
            {summary.dailyMissionsCompleted.length > 0 && (
              <p className="ui-title mt-3 text-center text-[11px] tracking-[0.16em] text-logo-green glow-green">
                {summary.dailyMissionsCompleted.length} DAILY MISSION
                {summary.dailyMissionsCompleted.length > 1 ? "S" : ""} COMPLETE
              </p>
            )}
            {summary.claimableXp > 0 && (
              <p className="ui-body mt-2 text-center text-[14px] text-arcade-muted">
                +{summary.claimableXp} XP waiting to be claimed
              </p>
            )}
            {summary.playStreak > 1 && (
              <p className="ui-title mt-3 text-center text-[11px] tracking-[0.16em] text-neon-gold">
                {summary.playStreak}-DAY PLAY STREAK
                {summary.streakXpAwarded > 0 ? ` · +${summary.streakXpAwarded} XP` : ""}
              </p>
            )}
            {summary.streakMilestones.length > 0 && (
              <p className="ui-body mt-1 text-center text-[14px] text-arcade-muted">
                Streak milestone reached: {summary.streakMilestones.join(", ")} days
              </p>
            )}
            {(newTitles.length > 0 || newBadges.length > 0) && (
              <p className="ui-body mt-2 text-center text-[14px] text-arcade-muted">
                Unlocked {[...newTitles, ...newBadges].join(", ")}
              </p>
            )}
            {summary.weeklyCompleted.length > 0 && (
              <p className="ui-title mt-2 text-center text-[11px] tracking-[0.16em] text-logo-green glow-green">
                WEEKLY CHALLENGE COMPLETE
              </p>
            )}
            {highlights.length > 0 && (
              <p className="ui-title mt-3 text-center text-[11px] tracking-[0.16em] text-neon-purple glow-purple">
                {highlights.join(" · ")}
              </p>
            )}
          </ChromeCard>
        )}


        {/* ---- 5. details on demand ---- */}
        {stage >= 2 && (
          <div className="mt-4">
            <ArcButton
              aria-expanded={detailsOpen}
              onClick={() => setDetailsOpen((v) => !v)}
              icon={
                <ChevronDown
                  className={`icon-chrome size-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              }
            >
              {detailsOpen ? "Hide run details" : "Run details"}
            </ArcButton>

            {detailsOpen && (
              <div className="mt-3 grid gap-3">
                <ChromeCard faceClassName="grid grid-cols-3 gap-3 p-4">
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
                </ChromeCard>

                {summary.xp.entries.length > 0 && (
                  <ChromeCard faceClassName="p-4">
                    <p className="ui-title text-[10px] tracking-[0.22em] text-arcade-muted">
                      XP BREAKDOWN
                    </p>
                    <ul className="mt-2 space-y-1">
                      {summary.xp.entries.map((entry) => (
                        <li
                          key={entry.label}
                          className="ui-body flex justify-between text-[14px] text-arcade-text/95"
                        >
                          <span>{entry.label}</span>
                          <span className="tabular-nums">+{entry.xp}</span>
                        </li>
                      ))}
                    </ul>
                  </ChromeCard>
                )}

                {summary.dailyProgress && (
                  <ChromeCard faceClassName="p-4">
                    <p className="ui-title text-[10px] tracking-[0.22em] text-neon-gold glow-gold">
                      DAILY CHALLENGE
                    </p>
                    <p className="ui-body mt-1.5 text-[15px] font-semibold text-arcade-text">
                      {dailyObjective}
                    </p>
                    <p className="ui-title mt-1 text-xs tracking-[0.14em] text-arcade-muted">
                      {summary.dailyProgress.completed
                        ? "COMPLETED · New challenge tomorrow"
                        : `${Math.round(summary.dailyProgress.value)} / ${summary.dailyProgress.target}`}
                    </p>
                  </ChromeCard>
                )}

                {summary.unlockedAchievements.length > 0 && (
                  <ChromeCard faceClassName="p-4">
                    <p className="ui-title flex items-center gap-2 text-[10px] tracking-[0.22em] text-neon-purple glow-purple">
                      <Trophy className="icon-chrome size-3.5" aria-hidden />
                      ACHIEVEMENTS UNLOCKED
                    </p>
                    <ul className="mt-1 space-y-1">
                      {summary.unlockedAchievements.map((a) => (
                        <li
                          key={a.id}
                          className="ui-body text-[15px] font-semibold text-arcade-text"
                        >
                          {a.title} · +{a.rewardXp} XP
                        </li>
                      ))}
                    </ul>
                  </ChromeCard>
                )}

                {summary.unlockedBoards.length > 0 && (
                  <ChromeCard faceClassName="p-4">
                    <p className="ui-title text-[10px] tracking-[0.22em] text-logo-green glow-green">
                      BOARD UNLOCKED
                    </p>
                    <p className="ui-body mt-1.5 text-[15px] font-semibold text-arcade-text">
                      {summary.unlockedBoards.map((id) => boardById(id).name).join(", ")}
                    </p>
                  </ChromeCard>
                )}

                {summary.missionCompleted && (
                  <ChromeCard faceClassName="p-4">
                    <p className="ui-title text-[10px] tracking-[0.22em] text-logo-green glow-green">
                      MISSION COMPLETE
                    </p>
                    <p className="ui-body mt-1.5 text-[15px] font-semibold text-arcade-text">
                      {summary.missionCompleted.label}
                    </p>
                  </ChromeCard>
                )}
              </div>
            )}
          </div>
        )}

        {stage >= 3 && summary.mission && (
          <ChromeCard className="mt-4" faceClassName="p-4">
            <p className="ui-title text-[10px] tracking-[0.22em] text-arcade-muted">
              NEXT RUN MISSION
            </p>
            <p className="ui-body mt-1.5 text-[15px] font-semibold text-arcade-text">
              {summary.mission.label}
            </p>
          </ChromeCard>
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
      className={`rounded-2xl border bg-arcade-surface/60 px-2 py-3 text-center shadow-[inset_0_1px_0_oklch(1_0_0_/_0.12)] ${
        isRecord ? "border-neon-gold" : "border-arcade-line/70"
      }`}
    >
      <p className="ui-title text-[11px] tracking-[0.12em] text-arcade-muted">{label}</p>
      <p className="score-digits mt-1 text-lg">{value}</p>
      {isRecord && (
        <p className="ui-title mt-1 text-[10px] tracking-[0.14em] text-neon-gold glow-gold">
          NEW BEST
        </p>
      )}
    </div>
  );
}
