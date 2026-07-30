import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useGame } from "@/game/useGame";
import { StartScreen } from "@/components/game/StartScreen";
import { GameScreen } from "@/components/game/GameScreen";
import { GameOverScreen } from "@/components/game/GameOverScreen";
import { SettingsModal } from "@/components/game/SettingsModal";

const TITLE = "Tap or Trap — Neon Reaction Game";
const DESCRIPTION =
  "Tap fast. Think faster. Hit green and gold, dodge red traps, double-tap purple, and chase your high score in this neon reaction arcade game.";

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

function TapOrTrap() {
  const game = useGame();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <main className="min-h-[100dvh] bg-arcade-bg-deep">
      <h1 className="sr-only">Tap or Trap — reaction arcade game</h1>

      {game.phase === "start" && (
        <StartScreen
          highScore={game.highScore}
          settings={game.settings}
          onSettingsChange={game.updateSettings}
          onStart={game.startGame}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {(game.phase === "playing" || game.phase === "paused") && (
        <GameScreen
          score={game.score}
          highScore={game.highScore}
          combo={game.combo}
          multiplier={game.multiplier}
          scorePulse={game.scorePulse}
          comboFlash={game.comboFlash}
          target={game.target}
          feedback={game.feedback}
          burst={game.burst}
          paused={game.phase === "paused"}
          shake={game.shake}
          flash={game.flash}
          onTap={game.tapTarget}
          onPause={game.pause}
          onResume={game.resume}
          onQuit={game.quit}
        />
      )}

      {game.phase === "over" && (
        <GameOverScreen
          score={game.score}
          highScore={game.highScore}
          bestCombo={game.bestCombo}
          avgReaction={game.avgReaction}
          reason={game.reason}
          onPlayAgain={game.startGame}
          onMenu={game.quit}
        />
      )}

      <SettingsModal
        open={settingsOpen}
        settings={game.settings}
        onChange={game.updateSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </main>
  );
}
