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
        <h1 className="text-center text-[clamp(42px,13vw,68px)] leading-none">
          <span className="sticker-text animate-slam text-neon-red glow-red">
            {reason ? GAME_OVER_HEADLINE[reason] : "RUN OVER!"}
          </span>
        </h1>
        <p className="mt-4 text-center text-lg font-black tracking-tight text-arcade-text">
          {reason ? GAME_OVER_MESSAGE[reason] : "Run ended"}
        </p>

        <div className="arcade-panel mt-8 p-6 text-center">
          <p className="sticker-sm text-[11px] tracking-[0.25em] text-arcade-muted">
            FINAL SCORE
          </p>
          <p className="sticker-text text-8xl leading-none text-neon-gold glow-gold tabular-nums">
            {score}
          </p>
          {isRecord && (
            <p className="sticker-sm shimmer-text mt-3 text-sm tracking-[0.2em]">
              NEW HIGH SCORE!
            </p>
          )}

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat
              label="HIGH"
              value={String(highScore)}
              tone="text-neon-gold glow-gold"
            />
            <Stat
              label="BEST COMBO"
              value={`${bestCombo}x`}
              tone="text-neon-purple glow-purple"
            />
            <Stat
              label="AVG REACT"
              value={avgReaction !== null ? `${avgReaction}ms` : "—"}
              tone="text-neon-green glow-green"
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
