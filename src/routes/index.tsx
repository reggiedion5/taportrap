import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useGame } from "@/game/useGame";
import { useProgress, type SessionSummary } from "@/game/useProgress";
import { useTraining } from "@/game/useTraining";
import type { Achievement, GameSessionResult } from "@/game/progressionTypes";
import { isGameMode, MODE_CONFIG, type GameMode } from "@/game/modes";
import type { Difficulty } from "@/game/difficulty";
import { MODE_CATALOG } from "@/game/trainingConfig";
import type {
  PlayableMode,
  TrainerSessionResult,
  TrainingDifficulty,
  TrainingMode,
  TrainingModule,
  TrainingRewardResult,
  ZenSessionResult,
} from "@/game/trainingTypes";
import { playSound } from "@/game/audio";
import { formatCount } from "@/game/format";
import { HomeScreen } from "@/components/game/HomeScreen";
import { GameScreen } from "@/components/game/GameScreen";
import { MinimalGameOverScreen } from "@/components/game/MinimalGameOverScreen";
import { GameOverScreen } from "@/components/game/GameOverScreen";
import { SettingsModal } from "@/components/game/SettingsModal";
import { OnboardingFlow } from "@/components/game/OnboardingFlow";
import { ModeInfoModal, ModeSelector } from "@/components/game/ModeSelector";
import { AchievementScreen } from "@/components/game/AchievementScreen";
import { StatisticsScreen } from "@/components/game/StatisticsScreen";
import { BOARDS } from "@/game/boards";
import { BoardCollectionScreen } from "@/components/game/BoardCollectionScreen";
import { BoardUnlockToast } from "@/components/game/BoardUnlockToast";
import { BoardProvider } from "@/components/game/BoardContext";
import { HowToPlayModal } from "@/components/game/HowToPlayModal";
import { AchievementToastQueue } from "@/components/game/AchievementToastQueue";
import { AppBootstrap } from "@/components/game/AppBootstrap";
import { TrainingScreen } from "@/components/game/TrainingScreen";
import { TrainingSetupModal } from "@/components/game/TrainingSetupModal";
import { TrainingSummaryScreen } from "@/components/game/TrainingSummaryScreen";
import { FeedbackModal } from "@/components/game/FeedbackModal";
import { PreGameCountdown } from "@/components/game/PreGameCountdown";
import type { ResetScope } from "@/components/game/DataResetSheet";
import { ACHIEVEMENTS } from "@/game/achievements";
import { DiagnosticPanel } from "@/components/game/DiagnosticPanel";

const TITLE = "Tap or Trap! — Neon Reaction Arcade Game";
const DESCRIPTION =
  "Six ways to play: four competitive modes plus Zen and a Reflex Trainer. Daily challenges, XP levels, 15 unlockable boards and 28 achievements.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TapOrTrap,
});

type Overlay =
  | "none"
  | "modes"
  | "achievements"
  | "statistics"
  | "boards"
  | "howto"
  | "settings"
  | "feedback"
  | "trainingSetup";

/** Non-competitive play runs on its own screen stack. */
type TrainingPhase = "idle" | "playing" | "summary";

function TapOrTrap() {
  const progress = useProgress();
  const training = useTraining(progress.grantXp);

  const [overlay, setOverlay] = useState<Overlay>("none");
  const [tutorial, setTutorial] = useState(false);
  const [modeIntro, setModeIntro] = useState(false);
  const [countdown, setCountdown] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [toasts, setToasts] = useState<Achievement[]>([]);
  const [focusAchievement, setFocusAchievement] = useState<string | null>(null);
  const [boardToasts, setBoardToasts] = useState<string[]>([]);
  const shownToastIds = useRef<Set<string>>(new Set());

  // selected playable mode (competitive modes live in progress, training here)
  const [playableMode, setPlayableMode] = useState<PlayableMode>(progress.mode);
  const [trainingPhase, setTrainingPhase] = useState<TrainingPhase>("idle");
  const [trainingModule, setTrainingModule] = useState<TrainingModule>("mixed");
  const [trainingDifficulty, setTrainingDifficulty] = useState<TrainingDifficulty>("standard");
  const [zenResult, setZenResult] = useState<ZenSessionResult | null>(null);
  const [trainerResult, setTrainerResult] = useState<TrainerSessionResult | null>(null);
  const [trainingReward, setTrainingReward] = useState<TrainingRewardResult | null>(null);

  const pendingToasts = useRef<Achievement[]>([]);

  const handleComplete = useCallback(
    (result: GameSessionResult) => {
      console.info("[loss-debug] handleComplete entered", {
        score: result.score,
        currentRound: result.stats.successes,
      });
      console.info("[loss-debug] before recordSession");
      const next = progress.recordSession(result);
      console.info("[loss-debug] after recordSession", { summaryExists: next !== null });
      if (!next) {
        console.info("[loss-debug] handleComplete conditional return: no summary");
        return;
      }
      console.info("[loss-debug] before setSummary", { sessionId: next.sessionId });
      setSummary(next);
      console.info("[loss-debug] after setSummary");
      pendingToasts.current = next.unlockedAchievements;
      if (next.unlockedBoards.length > 0) {
        setBoardToasts((prev) => [
          ...prev,
          ...next.unlockedBoards.filter((id) => !prev.includes(id)),
        ]);
      }
      if (next.unlockedAchievements.length > 0) playSound("unlock");
    },
    [progress],
  );

  const game = useGame({
    mode: progress.mode,
    difficulty: progress.difficulty,
    onComplete: handleComplete,
  });

  const isTrainingMode = playableMode === "zen" || playableMode === "trainer";
  const catalogEntry = MODE_CATALOG[playableMode];

  // achievement toasts are only shown once the run is over
  useEffect(() => {
    if (game.phase === "over" && pendingToasts.current.length > 0) {
      const fresh = pendingToasts.current.filter((a) => !shownToastIds.current.has(a.id));
      fresh.forEach((a) => shownToastIds.current.add(a.id));
      pendingToasts.current = [];
      if (fresh.length > 0) {
        setToasts((prev) => [
          ...prev,
          ...fresh.filter((a) => !prev.some((p) => p.id === a.id)),
        ]);
      }
    }
  }, [game.phase]);

  // equipped board drives the interface palette via :root custom properties
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.board = progress.activeBoard.id;
    const applied = Object.entries(progress.activeBoard.vars);
    applied.forEach(([key, value]) => root.style.setProperty(key, value));
    return () => {
      applied.forEach(([key]) => root.style.removeProperty(key));
    };
  }, [progress.activeBoard]);

  useEffect(() => {
    if (game.reducedMotion) {
      document.documentElement.dataset.motion = "reduced";
    } else {
      delete document.documentElement.dataset.motion;
    }
  }, [game.reducedMotion]);

  /* ---------------- mode selection ---------------- */

  const selectMode = useCallback(
    (mode: PlayableMode) => {
      setPlayableMode(mode);
      if (isGameMode(mode)) {
        progress.setMode(mode);
        training.setLastCompetitiveMode(mode);
      }
    },
    [progress, training],
  );

  /* ---------------- competitive flow ---------------- */

  const beginRun = useCallback(() => {
    setSummary(null);
    setModeIntro(false);
    setCountdown(false);
    game.startGame();
  }, [game]);

  const launchCompetitive = useCallback(() => {
    setSummary(null);
    setModeIntro(false);
    if (game.settings.skipCountdown) {
      beginRun();
      return;
    }
    setCountdown(true);
  }, [beginRun, game.settings.skipCountdown]);

  /* ---------------- training flow ---------------- */

  const startTraining = useCallback(() => {
    setZenResult(null);
    setTrainerResult(null);
    setTrainingReward(null);
    setOverlay("none");
    setTrainingPhase("playing");
  }, []);

  const handleZenComplete = useCallback(
    (result: ZenSessionResult) => {
      setZenResult(result);
      setTrainerResult(null);
      setTrainingReward(training.recordZenSession(result));
      setTrainingPhase("summary");
    },
    [training],
  );

  const handleTrainerComplete = useCallback(
    (result: TrainerSessionResult) => {
      setTrainerResult(result);
      setZenResult(null);
      setTrainingReward(training.recordTrainerSession(result));
      setTrainingPhase("summary");
    },
    [training],
  );

  const handlePlay = useCallback(() => {
    if (isTrainingMode) {
      setOverlay("trainingSetup");
      return;
    }
    if (!progress.profile.seenModeIntros.includes(progress.mode)) {
      setModeIntro(true);
      return;
    }
    launchCompetitive();
  }, [isTrainingMode, launchCompetitive, progress.mode, progress.profile.seenModeIntros]);

  const goToMenu = useCallback(() => {
    setTrainingPhase("idle");
    setCountdown(false);
    game.goToMenu();
  }, [game]);

  /* ---------------- data resets ---------------- */

  const handleReset = useCallback(
    (scope: ResetScope) => {
      switch (scope) {
        case "statistics":
          progress.clearStatistics();
          break;
        case "training":
          training.resetTraining();
          break;
        case "daily":
          progress.clearDailyProgress();
          break;
        case "everything":
          progress.resetAllData();
          if (typeof window !== "undefined") window.location.reload();
          break;
      }
    },
    [progress, training],
  );

  const showOnboarding = progress.hydrated && (tutorial || !progress.profile.onboardingCompleted);

  const shell = (content: React.ReactNode) => (
    <AppBootstrap
      dataHydrated={progress.hydrated && training.ready}
      boardId={progress.activeBoard.id}
      onReturnToMenu={goToMenu}
    >
      <BoardProvider
        boardId={progress.activeBoard.id}
        effectsEnabled={game.settings.boardEffects}
        reducedMotion={game.reducedMotion}
      >
        {content}
      </BoardProvider>
    </AppBootstrap>
  );

  if (showOnboarding) {
    return shell(
      <main className="min-h-[100dvh] bg-arcade-bg-deep">
        <h1 className="sr-only">Tap or Trap! tutorial</h1>
        <OnboardingFlow
          reducedMotion={game.reducedMotion}
          onFinish={() => {
            progress.completeOnboarding();
            setTutorial(false);
          }}
          onSkip={() => {
            progress.completeOnboarding();
            setTutorial(false);
          }}
        />
      </main>,
    );
  }

  const emptyBests: Record<Difficulty, number> = { beginner: 0, standard: 0, expert: 0 };
  /** Per-difficulty bests for a mode, tolerant of unknown/training mode ids. */
  const bestsForMode = (mode: string): Record<Difficulty, number> => {
    const table = progress.records.highScoreByDifficulty as Record<
      string,
      Record<Difficulty, number> | undefined
    >;
    const modeBests = table[mode];
    return modeBests ? { ...emptyBests, ...modeBests } : emptyBests;
  };

  const bestLabel = isTrainingMode
    ? playableMode === "zen"
      ? `BEST ${formatCount(training.training.zen.bestTapCount)} TAPS`
      : `BEST ${Math.round(
          Math.max(
            0,
            ...Object.values(training.training.trainer.modules).map((m) => m.bestAccuracy),
          ) * 100,
        )}%`
    : `BEST ${formatCount(bestsForMode(playableMode)[progress.difficulty] ?? 0)}`;

  const activeBest = bestsForMode(progress.mode)[progress.difficulty] ?? 0;

  const showHome = game.phase === "start" && trainingPhase === "idle" && !countdown;

  console.info("[loss-debug] TapOrTrap render branch", {
    phase: game.phase,
    summaryExists: summary !== null,
    score: game.score,
    bestScore: activeBest,
    lives: game.lives,
    currentRound: game.runStats.successes,
    animationFlags: {
      shake: game.shake,
      flash: game.flash,
      lifeLost: game.lifeLost,
      countdown,
      modeIntro,
    },
    branches: {
      showHome,
      game: game.phase === "playing" || game.phase === "paused",
      gameOver: game.phase === "over",
    },
  });

  return shell(
    <main className="min-h-[100dvh] bg-arcade-bg-deep">
      <h1 className="sr-only">Tap or Trap! — reaction arcade game</h1>

      {showHome && (
        <HomeScreen
          level={progress.level}
          modeName={catalogEntry.name}
          modeTagline={catalogEntry.description}
          modeBestLabel={bestLabel}
          isTrainingMode={isTrainingMode}
          difficulty={progress.difficulty}
          onDifficultyChange={progress.setDifficulty}
          difficultyBests={bestsForMode(playableMode)}
          daily={progress.daily}
          challenge={progress.challenge}
          boardHint={progress.boardHint}
          boardsUnlocked={progress.unlockedBoardIds.length}
          boardsTotal={BOARDS.length}
          newBoardCount={progress.newBoardCount}
          reducedMotion={game.reducedMotion}
          achievementsUnlocked={progress.unlockedAchievementCount}
          achievementsTotal={ACHIEVEMENTS.length}
          onPlay={handlePlay}
          onOpenModes={() => setOverlay("modes")}
          onOpenAchievements={() => setOverlay("achievements")}
          onOpenStatistics={() => setOverlay("statistics")}
          onOpenBoards={() => {
            progress.markBoardsSeen();
            setOverlay("boards");
          }}
          onOpenSettings={() => setOverlay("settings")}
          onOpenHowToPlay={() => setOverlay("howto")}
        />
      )}

      {countdown && (
        <PreGameCountdown
          title={`${MODE_CONFIG[progress.mode].name} mode`}
          reducedMotion={game.reducedMotion}
          onDone={beginRun}
          onCancel={() => setCountdown(false)}
        />
      )}

      {trainingPhase === "playing" && isTrainingMode && (
        <TrainingScreen
          mode={playableMode as TrainingMode}
          module={trainingModule}
          difficulty={trainingDifficulty}
          kidsAssist={game.settings.kidsAssist}
          reducedMotion={game.reducedMotion}
          shortCountdown={game.settings.skipCountdown}
          onZenComplete={handleZenComplete}
          onTrainerComplete={handleTrainerComplete}
          onQuit={goToMenu}
        />
      )}

      {trainingPhase === "summary" && (
        <TrainingSummaryScreen
          zen={zenResult}
          trainer={trainerResult}
          reward={trainingReward}
          onAgain={startTraining}
          onChangeMode={() => {
            setTrainingPhase("idle");
            setOverlay("modes");
          }}
          onMenu={goToMenu}
        />
      )}

      {(game.phase === "playing" || game.phase === "paused") && (
        <GameScreen
          mode={progress.mode}
          score={game.score}
          highScore={activeBest}
          combo={game.combo}
          multiplier={game.multiplier}
          scorePulse={game.scorePulse}
          difficultyLabel={game.difficulty.label}
          comboFlash={game.comboFlash}
          milestone={game.milestone}
          pulse={game.pulse}
          perfectFlash={game.perfectFlash}
          greatFlash={game.greatFlash}
          levelUp={game.levelUp}
          target={game.target}
          feedback={game.feedback}
          burst={game.burst}
          paused={game.phase === "paused"}
          pauseSource={game.pauseSource}
          shake={game.shake}
          flash={game.flash}
          reducedMotion={game.reducedMotion}
          timeLeft={game.timeLeft}
          lives={game.lives}
          lifeLost={game.lifeLost}
          avgReaction={game.runStats.avgReaction}
          runStatsSuccesses={game.runStats.successes}
          registerArea={game.registerArea}
          onTap={game.tapTarget}
          onPause={game.pause}
          onResume={game.resume}
          onQuit={game.quitRun}
        />
      )}

      {game.phase === "over" &&
        (summary ? (
          <GameOverScreen
            summary={summary}
            difficultyLabel={game.difficulty.label}
            levelCurrentXp={progress.level.currentXp}
            levelXpForNext={progress.level.xpForNext}
            dailyObjective={progress.challenge.objective}
            playerLevel={progress.level.level}
            reducedMotion={game.reducedMotion}
            onPlayAgain={launchCompetitive}
            onChangeMode={() => {
              goToMenu();
              setOverlay("modes");
            }}
            onMenu={goToMenu}
          />
        ) : (
          <MinimalGameOverScreen
            score={game.lastResult?.score ?? game.score}
            bestScore={activeBest}
            onPlayAgain={launchCompetitive}
            onHome={goToMenu}
          />
        ))}


      <ModeSelector
        open={overlay === "modes"}
        selected={playableMode}
        records={progress.records}
        training={training.training}
        onSelect={selectMode}
        onClose={() => setOverlay("none")}
      />

      <TrainingSetupModal
        open={overlay === "trainingSetup" && isTrainingMode}
        mode={playableMode as TrainingMode}
        module={trainingModule}
        difficulty={trainingDifficulty}
        kidsAssist={game.settings.kidsAssist}
        training={training.training}
        onModuleChange={setTrainingModule}
        onDifficultyChange={setTrainingDifficulty}
        onKidsAssistChange={(v) => game.updateSettings({ kidsAssist: v })}
        onStart={startTraining}
        onClose={() => setOverlay("none")}
      />

      <AchievementScreen
        open={overlay === "achievements"}
        progress={progress.achievementList}
        focusId={focusAchievement}
        onClose={() => {
          setOverlay("none");
          setFocusAchievement(null);
        }}
      />

      <StatisticsScreen
        open={overlay === "statistics"}
        statistics={progress.statistics}
        records={progress.records}
        daily={progress.daily}
        level={progress.level}
        lifetimeXp={progress.profile.lifetimeXp}
        onReset={progress.clearStatistics}
        onClose={() => setOverlay("none")}
      />

      <BoardCollectionScreen
        open={overlay === "boards"}
        selectedBoardId={progress.activeBoard.id}
        context={progress.boardContext}
        effectsEnabled={game.settings.boardEffects}
        reducedMotion={game.reducedMotion}
        onSelect={progress.setBoard}
        onClose={() => setOverlay("none")}
      />

      <HowToPlayModal
        open={overlay === "howto"}
        onClose={() => setOverlay("none")}
        onReplayTutorial={() => {
          setOverlay("none");
          setTutorial(true);
        }}
      />

      <SettingsModal
        open={overlay === "settings"}
        settings={game.settings}
        onChange={game.updateSettings}
        onReset={handleReset}
        onOpenFeedback={() => setOverlay("feedback")}
        onClose={() => setOverlay("none")}
      />

      <FeedbackModal open={overlay === "feedback"} onClose={() => setOverlay("none")} />

      <ModeInfoModal
        open={modeIntro}
        mode={progress.mode}
        onStart={() => {
          progress.markModeIntroSeen(progress.mode);
          launchCompetitive();
        }}
        onClose={() => setModeIntro(false)}
      />

      <AchievementToastQueue
        queue={toasts}
        reducedMotion={game.reducedMotion}
        onDismiss={(id) => setToasts((prev) => prev.filter((a) => a.id !== id))}
        onView={(id) => {
          setToasts([]);
          setFocusAchievement(id ?? null);
          setOverlay("achievements");
        }}
      />

      {showHome && (
        <BoardUnlockToast
          queue={boardToasts}
          reducedMotion={game.reducedMotion}
          onDismiss={(id) => setBoardToasts((prev) => prev.filter((b) => b !== id))}
          onEquip={progress.setBoard}
        />
      )}

      <DiagnosticPanel
        phase={game.phase}
        score={game.score}
        combo={game.combo}
        tierLabel={game.tier.label}
        tierLevel={game.tier.level}
        reaction={game.lastTap?.reaction ?? null}
        timing={game.lastTap?.timing ?? null}
        closeCall={game.lastTap?.closeCall ?? false}
        summaryExists={summary !== null}
      />
    </main>,
  );
}
