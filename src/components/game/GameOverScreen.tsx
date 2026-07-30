import { GAME_OVER_MESSAGE, type GameOverReason } from "@/game/types";
import { ArcadeBackdrop } from "./ArcadeBackdrop";

interface GameOverScreenProps {
  score: number;
  highScore: number;
  bestCombo: number;
  avgReaction: number | null;
  reason: GameOverReason | null;
  onPlayAgain: () => void;
  onMenu: () => void;
}

export function GameOverScreen({
  score,
  highScore,
  bestCombo,
  avgReaction,
  reason,
  onPlayAgain,
  onMenu,
}: GameOverScreenProps) {
  const isRecord = score > 0 && score >= highScore;

  return (
    <div className="no-select relative min-h-[100dvh] overflow-hidden">
      <ArcadeBackdrop />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col justify-center px-5 py-10">
        <h1 className="text-center text-[clamp(40px,12vw,64px)] leading-none font-black tracking-tighter text-neon-red">
          Game Over
        </h1>
        <p className="mt-3 text-center text-lg font-bold text-arcade-text">
          {reason ? GAME_OVER_MESSAGE[reason] : "Run ended"}
        </p>

        <div className="arcade-panel mt-8 p-6 text-center">
          <p className="text-[11px] font-bold tracking-[0.25em] text-arcade-muted">
            FINAL SCORE
          </p>
          <p className="text-7xl leading-none font-black text-arcade-text tabular-nums">
            {score}
          </p>
          {isRecord && (
            <p className="mt-3 inline-block rounded-full bg-neon-gold px-4 py-1 text-xs font-black tracking-widest text-arcade-bg-deep">
              NEW HIGH SCORE
            </p>
          )}

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="HIGH" value={String(highScore)} tone="text-neon-gold" />
            <Stat
              label="BEST COMBO"
              value={`${bestCombo}x`}
              tone="text-neon-purple"
            />
            <Stat
              label="AVG REACT"
              value={avgReaction !== null ? `${avgReaction}ms` : "—"}
              tone="text-neon-green"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onPlayAgain}
          className="arcade-btn mt-7 w-full bg-neon-green py-5 text-xl text-arcade-bg-deep shadow-[0_0_40px_-8px_var(--neon-green)]"
        >
          Play Again
        </button>
        <button
          type="button"
          onClick={onMenu}
          className="arcade-btn mt-3 w-full border border-arcade-line bg-arcade-surface py-4 text-base text-arcade-text"
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-arcade-line bg-arcade-surface/70 px-2 py-3">
      <p className="text-[9px] font-bold tracking-[0.16em] text-arcade-muted">
        {label}
      </p>
      <p className={`mt-1 text-lg font-black tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
