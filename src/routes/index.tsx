import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useGame } from "@/game/useGame";
import { useProgress, type SessionSummary } from "@/game/useProgress";
import type { Achievement, GameSessionResult } from "@/game/progressionTypes";
import { playSound } from "@/game/audio";
import { HomeScreen } from "@/components/game/HomeScreen";
import { GameScreen } from "@/components/game/GameScreen";
import { GameOverScreen } from "@/components/game/GameOverScreen";
import { SettingsModal } from "@/components/game/SettingsModal";
import { OnboardingFlow } from "@/components/game/OnboardingFlow";
import { ModeInfoModal, ModeSelector } from "@/components/game/ModeSelector";
import { AchievementScreen } from "@/components/game/AchievementScreen";
import { StatisticsScreen } from "@/components/game/StatisticsScreen";
import { ThemeScreen } from "@/components/game/ThemeScreen";
import { HowToPlayModal } from "@/components/game/HowToPlayModal";
import { AchievementToastQueue } from "@/components/game/AchievementToastQueue";
import { ACHIEVEMENTS } from "@/game/achievements";

const TITLE = "Tap or Trap — Neon Reaction Arcade Game";
const DESCRIPTION =
  "Four game modes, daily challenges, XP levels, unlockable themes and achievements. Hit green and gold, dodge red traps and chase your best score.";

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

type Overlay = "none" | "modes" | "achievements" | "statistics" | "themes" | "howto" | "settings";

function TapOrTrap() {
  const progress = useProgress();
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [tutorial, setTutorial] = useState(false);
  const [modeIntro, setModeIntro] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [toasts, setToasts] = useState<Achievement[]>([]);
  
  const pendingToasts = useRef<Achievement[]>([]);

  const handleComplete = useCallback(
    (result: GameSessionResult) => {
      const next = progress.recordSession(result);
      if (!next) return;
      setSummary(next);
      pendingToasts.current = next.unlockedAchievements;
      if (next.unlockedAchievements.length > 0) playSound("unlock");
    },
    [progress],
  );

  const game = useGame({ mode: progress.mode, onComplete: handleComplete });

  // achievement toasts are only shown once the run is over
  useEffect(() => {
    if (game.phase === "over" && pendingToasts.current.length > 0) {
      setToasts(pendingToasts.current);
      pendingToasts.current = [];
    }
  }, [game.phase]);

  // apply the selected theme to the document
  useEffect(() => {
    document.documentElement.dataset.theme = progress.activeTheme.id;
  }, [progress.activeTheme.id]);

  useEffect(() => {
    if (game.reducedMotion) {
      document.documentElement.dataset.motion = "reduced";
    } else {
      delete document.documentElement.dataset.motion;
    }
  }, [game.reducedMotion]);

  const beginRun = useCallback(() => {
    setSummary(null);
    setModeIntro(false);
    game.startGame();
  }, [game]);

  const handlePlay = useCallback(() => {
    if (!progress.profile.seenModeIntros.includes(progress.mode)) {
      setModeIntro(true);
      return;
    }
    beginRun();
  }, [beginRun, progress.mode, progress.profile.seenModeIntros]);

  const showOnboarding = progress.hydrated && (tutorial || !progress.profile.onboardingCompleted);

  if (showOnboarding) {
    return (
      <main className="min-h-[100dvh] bg-arcade-bg-deep">
        <h1 className="sr-only">Tap or Trap tutorial</h1>
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
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-arcade-bg-deep">
      <h1 className="sr-only">Tap or Trap — reaction arcade game</h1>

      {game.phase === "start" && (
        <HomeScreen
          level={progress.level}
          modeConfig={progress.modeConfig}
          modeHighScore={progress.records.highScore[progress.mode]}
          daily={progress.daily}
          challenge={progress.challenge}
          themeHint={progress.themeHint}
          reducedMotion={game.reducedMotion}
          achievementsUnlocked={progress.unlockedAchievementCount}
          achievementsTotal={ACHIEVEMENTS.length}
          onPlay={handlePlay}
          onOpenModes={() => setOverlay("modes")}
          onOpenAchievements={() => setOverlay("achievements")}
          onOpenStatistics={() => setOverlay("statistics")}
          onOpenThemes={() => setOverlay("themes")}
          onOpenSettings={() => setOverlay("settings")}
          onOpenHowToPlay={() => setOverlay("howto")}
          
        />
      )}

      {(game.phase === "playing" || game.phase === "paused") && (
        <GameScreen
          mode={progress.mode}
          score={game.score}
          highScore={progress.records.highScore[progress.mode]}
          combo={game.combo}
          multiplier={game.multiplier}
          scorePulse={game.scorePulse}
          comboFlash={game.comboFlash}
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
          registerArea={game.registerArea}
          onTap={game.tapTarget}
          onPause={game.pause}
          onResume={game.resume}
          onQuit={game.quitRun}
        />
      )}

      {game.phase === "over" && summary && (
        <GameOverScreen
          summary={summary}
          levelCurrentXp={progress.level.currentXp}
          levelXpForNext={progress.level.xpForNext}
          dailyObjective={progress.challenge.objective}
          reducedMotion={game.reducedMotion}
          onPlayAgain={beginRun}
          onChangeMode={() => {
            game.goToMenu();
            setOverlay("modes");
          }}
          onMenu={game.goToMenu}
        />
      )}

      <ModeSelector
        open={overlay === "modes"}
        selected={progress.mode}
        records={progress.records}
        onSelect={progress.setMode}
        onClose={() => setOverlay("none")}
      />

      <AchievementScreen
        open={overlay === "achievements"}
        progress={progress.achievementList}
        onClose={() => setOverlay("none")}
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

      <ThemeScreen
        open={overlay === "themes"}
        selectedTheme={progress.activeTheme.id}
        context={progress.themeContext}
        onSelect={progress.setTheme}
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
        onClose={() => setOverlay("none")}
      />

      <ModeInfoModal
        open={modeIntro}
        mode={progress.mode}
        onStart={() => {
          progress.markModeIntroSeen(progress.mode);
          beginRun();
        }}
        onClose={() => setModeIntro(false)}
      />

      <AchievementToastQueue
        queue={toasts}
        reducedMotion={game.reducedMotion}
        onDismiss={(id) => setToasts((prev) => prev.filter((a) => a.id !== id))}
      />
    </main>
  );
}
