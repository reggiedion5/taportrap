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
import { DailyMissionsScreen } from "@/components/game/DailyMissionsScreen";
import { StatisticsScreen } from "@/components/game/StatisticsScreen";
import { BOARDS } from "@/game/boards";
import { BoardCollectionScreen } from "@/components/game/BoardCollectionScreen";
import { WeeklyChallengesScreen } from "@/components/game/WeeklyChallengesScreen";
import { PlayerProfileScreen } from "@/components/game/PlayerProfileScreen";
import { CollectionHubScreen } from "@/components/game/CollectionHubScreen";
import { NotificationCenter } from "@/components/game/NotificationCenter";
import { LeaderboardScreen } from "@/components/game/LeaderboardScreen";
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
import { TutorialScreen } from "@/components/game/TutorialScreen";
import { AboutScreen } from "@/components/game/AboutScreen";
import { PrivacyCenterScreen } from "@/components/game/PrivacyCenterScreen";
import { TermsScreen } from "@/components/game/TermsScreen";
import { HelpCenterScreen } from "@/components/game/HelpCenterScreen";
import { ReleaseQAScreen } from "@/components/game/ReleaseQAScreen";
import { TUTORIAL_XP } from "@/game/tutorial";
import { GAME_FEATURES, qaScreenVisible } from "@/config/gameFeatures";
import { trackEvent } from "@/lib/analytics";

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
  | "missions"
  | "statistics"
  | "boards"
  | "howto"
  | "settings"
  | "feedback"
  | "trainingSetup"
  | "weekly"
  | "profile"
  | "collection"
  | "notifications"
  | "leaderboard"
  | "about"
  | "privacy"
  | "terms"
  | "help"
  | "qa";

/** Non-competitive play runs on its own screen stack. */
type TrainingPhase = "idle" | "playing" | "summary";

/** Full-screen teaching flows that replace the whole app shell. */
type Teaching = "none" | "onboarding" | "tutorial";

function TapOrTrap() {
  const progress = useProgress();
  const training = useTraining(progress.grantXp);

  const [overlay, setOverlay] = useState<Overlay>("none");
  const [teaching, setTeaching] = useState<Teaching>("none");
  const [practice, setPractice] = useState(false);
  const [tutorialXp, setTutorialXp] = useState<number | null>(null);
  const [crash, setCrash] = useState(false);
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
      const next = progress.recordSession(result);
      if (!next) {
        return;
      }
      setSummary(next);
      pendingToasts.current = next.unlockedAchievements;
      if (next.unlockedBoards.length > 0) {
        setBoardToasts((prev) => [
          ...prev,
          ...next.unlockedBoards.filter((id) => !prev.includes(id)),
        ]);
      }
      if (next.unlockedAchievements.length > 0) playSound("unlock");
      trackEvent("game_completed", { mode: result.mode, score: result.score });
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
        setToasts((prev) => [...prev, ...fresh.filter((a) => !prev.some((p) => p.id === a.id))]);
      }
    }
  }, [game.phase]);

  useEffect(() => {
    trackEvent("app_open", {});
  }, []);

  useEffect(() => {
    if (tutorialXp === null) return;
    const t = window.setTimeout(() => setTutorialXp(null), 4000);
    return () => window.clearTimeout(t);
  }, [tutorialXp]);

  // equipped board drives the interface palette via :root custom properties
  useEffect(() => {
    const root = document.documentElement;
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
    trackEvent("game_started", { mode: progress.mode, difficulty: progress.difficulty });
    game.startGame();
  }, [game, progress.mode, progress.difficulty]);

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
      setTrainingReward(practice ? null : training.recordZenSession(result));
      setTrainingPhase("summary");
    },
    [practice, training],
  );

  const handleTrainerComplete = useCallback(
    (result: TrainerSessionResult) => {
      setTrainerResult(result);
      setZenResult(null);
      setTrainingReward(practice ? null : training.recordTrainerSession(result));
      setTrainingPhase("summary");
    },
    [practice, training],
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
    setPractice(false);
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

  const showOnboarding =
    progress.hydrated &&
    (teaching === "onboarding" ||
      (GAME_FEATURES.onboarding && !progress.profile.onboardingCompleted));
  const showTutorial = progress.hydrated && !showOnboarding && teaching === "tutorial";

  const finishOnboarding = useCallback(() => {
    progress.completeOnboarding();
    setTeaching("none");
  }, [progress]);

  /** Practice runs use the training surface but never record anything. */
  const openPractice = useCallback(() => {
    setPractice(true);
    setPlayableMode("trainer");
    setOverlay("trainingSetup");
    trackEvent("practice_started", {});
  }, []);

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
            finishOnboarding();
            if (GAME_FEATURES.tutorial && !progress.profile.tutorialCompleted) {
              setTeaching("tutorial");
            }
          }}
          onSkip={finishOnboarding}
        />
      </main>,
    );
  }

  if (showTutorial) {
    return shell(
      <main className="min-h-[100dvh] bg-arcade-bg-deep">
        <h1 className="sr-only">Tap or Trap! interactive tutorial</h1>
        <TutorialScreen
          reducedMotion={game.reducedMotion}
          rewardAlreadyGiven={progress.profile.tutorialRewardClaimed}
          onFinish={() => {
            const awarded = progress.completeTutorial(TUTORIAL_XP);
            setTutorialXp(awarded);
            setTeaching("none");
            trackEvent("tutorial_completed", { xp: awarded });
          }}
          onExit={() => setTeaching("none")}
        />
      </main>,
    );
  }

  if (crash) throw new Error("Release QA: test error boundary");

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
          missions={progress.missions}
          claimableMissions={progress.claimableMissions}
          claimableAchievements={progress.claimableAchievementCount}
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
          onOpenMissions={() => setOverlay("missions")}
          onOpenStatistics={() => setOverlay("statistics")}
          onOpenBoards={() => {
            progress.markBoardsSeen();
            setOverlay("boards");
          }}
          onOpenSettings={() => setOverlay("settings")}
          onOpenHowToPlay={() => setOverlay("howto")}
          weekly={progress.weekly}
          claimableWeekly={progress.claimableWeekly}
          playStreak={progress.playStreak}
          playerTitle={progress.equippedTitle.name}
          unreadNotifications={progress.unreadNotifications}
          loginAvailable={progress.loginAvailable}
          onOpenWeekly={() => setOverlay("weekly")}
          onOpenProfile={() => setOverlay("profile")}
          onOpenNotifications={() => setOverlay("notifications")}
          onOpenLeaderboard={() => setOverlay("leaderboard")}
          onOpenCollection={() => setOverlay("collection")}
        />
      )}

      {showHome && tutorialXp !== null && (
        <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex justify-center px-4">
          <p className="ui-title rounded-xl border border-neon-green/60 bg-arcade-surface px-4 py-2 text-[15px] text-neon-green">
            {tutorialXp > 0 ? `Tutorial complete · +${tutorialXp} XP` : "Tutorial complete"}
          </p>
        </div>
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
          practice={practice}
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
          practice={practice}
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
            playerTitle={progress.equippedTitle.name}
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
        claimedIds={progress.achievementStore.claimed}
        onClaim={progress.claimAchievement}
        onClaimAll={progress.claimAllRewards}
        onClose={() => {
          setOverlay("none");
          setFocusAchievement(null);
        }}
      />

      <DailyMissionsScreen
        open={overlay === "missions"}
        missions={progress.missions}
        reducedMotion={game.reducedMotion}
        onClaim={progress.claimDailyMission}
        onClose={() => setOverlay("none")}
      />

      <StatisticsScreen
        open={overlay === "statistics"}
        statistics={progress.statistics}
        history={progress.runHistory}
        aggregates={progress.phase3.dailyAggregates}
        onClearHistory={progress.clearHistory}
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

      <WeeklyChallengesScreen
        open={overlay === "weekly"}
        weekly={progress.weekly}
        reducedMotion={game.reducedMotion}
        onClaim={progress.claimWeeklyChallenge}
        onClose={() => setOverlay("none")}
      />

      <PlayerProfileScreen
        open={overlay === "profile"}
        phase3={progress.phase3}
        level={progress.level}
        lifetimeXp={progress.profile.lifetimeXp}
        gamesPlayed={progress.statistics.gamesPlayed}
        achievementsUnlocked={progress.unlockedAchievementCount}
        achievementsTotal={ACHIEVEMENTS.length}
        boardsUnlocked={progress.unlockedBoardIds.length}
        boardsTotal={BOARDS.length}
        playStreak={progress.playStreak}
        loginAvailable={progress.loginAvailable}
        cosmetics={progress.cosmeticContext}
        favorites={progress.favorites}
        reducedMotion={game.reducedMotion}
        onClaimLogin={progress.claimDailyLogin}
        onOpenStatistics={() => setOverlay("statistics")}
        onOpenCollection={() => setOverlay("collection")}
        onOpenLeaderboard={() => setOverlay("leaderboard")}
        onClose={() => setOverlay("none")}
      />

      <CollectionHubScreen
        open={overlay === "collection"}
        cosmetics={progress.cosmeticContext}
        unlockedTitleIds={progress.unlockedTitleIds}
        unlockedBadgeIds={progress.unlockedBadgeIds}
        equippedTitleId={progress.phase3.equippedTitleId}
        equippedBadgeId={progress.phase3.equippedBadgeId}
        boardsUnlocked={progress.unlockedBoardIds.length}
        boardsTotal={BOARDS.length}
        onEquipTitle={progress.equipTitle}
        onEquipBadge={progress.equipBadge}
        onOpenBoards={() => {
          progress.markBoardsSeen();
          setOverlay("boards");
        }}
        onClose={() => setOverlay("none")}
      />

      <LeaderboardScreen
        open={overlay === "leaderboard"}
        history={progress.runHistory}
        onClose={() => setOverlay("none")}
      />

      <NotificationCenter
        open={overlay === "notifications"}
        notifications={progress.notifications}
        onRead={progress.markNotificationRead}
        onMarkAllRead={progress.markNotificationsRead}
        onClear={progress.clearNotifications}
        onOpenTarget={(target) => {
          if (target === "achievements") setOverlay("achievements");
          else if (target === "boards") setOverlay("boards");
          else if (target === "missions") setOverlay("missions");
          else if (target === "weekly") setOverlay("weekly");
          else if (target === "collection") setOverlay("collection");
          else if (target === "profile") setOverlay("profile");
        }}
        onClose={() => setOverlay("none")}
      />

      <HowToPlayModal
        open={overlay === "howto"}
        onClose={() => setOverlay("none")}
        onReplayTutorial={() => {
          setOverlay("none");
          setTeaching("tutorial");
        }}
      />

      <SettingsModal
        open={overlay === "settings"}
        settings={game.settings}
        onChange={game.updateSettings}
        onReset={handleReset}
        onOpenFeedback={() => setOverlay("feedback")}
        onOpenAbout={() => setOverlay("about")}
        onOpenHelp={() => setOverlay("help")}
        onOpenPrivacy={() => setOverlay("privacy")}
        onOpenQA={qaScreenVisible() ? () => setOverlay("qa") : undefined}
        onClose={() => setOverlay("none")}
      />

      <AboutScreen
        open={overlay === "about"}
        onOpenPrivacy={() => setOverlay("privacy")}
        onOpenTerms={() => setOverlay("terms")}
        onOpenSupport={() => setOverlay("feedback")}
        onImported={progress.reloadFromStorage}
        onClose={() => setOverlay("none")}
      />

      <PrivacyCenterScreen
        open={overlay === "privacy"}
        onOpenTerms={() => setOverlay("terms")}
        onOpenSupport={() => setOverlay("feedback")}
        onImported={progress.reloadFromStorage}
        onClose={() => setOverlay("none")}
      />

      <TermsScreen
        open={overlay === "terms"}
        onOpenPrivacy={() => setOverlay("privacy")}
        onClose={() => setOverlay("none")}
      />

      <HelpCenterScreen
        open={overlay === "help"}
        onReplayOnboarding={() => {
          setOverlay("none");
          setTeaching("onboarding");
        }}
        onReplayTutorial={() => {
          setOverlay("none");
          setTeaching("tutorial");
        }}
        onOpenPractice={() => {
          setOverlay("none");
          openPractice();
        }}
        onOpenFeedback={() => setOverlay("feedback")}
        onOpenPrivacy={() => setOverlay("privacy")}
        onOpenTerms={() => setOverlay("terms")}
        onClose={() => setOverlay("none")}
      />

      <ReleaseQAScreen
        open={overlay === "qa"}
        onResetOnboarding={progress.resetOnboarding}
        onThrowTestError={() => setCrash(true)}
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
