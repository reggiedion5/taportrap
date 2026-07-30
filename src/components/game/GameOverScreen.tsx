import {
  GAME_OVER_HEADLINE,
  GAME_OVER_MESSAGE,
  type GameOverReason,
  type LifetimeStats,
  type RunStats,
} from "@/game/types";
import { ArcadeBackdrop } from "./ArcadeBackdrop";

interface GameOverScreenProps {
  score: number;
  highScore: number;
  bestCombo: number;
  stats: RunStats;
  lifetime: LifetimeStats;
  reason: GameOverReason | null;
  onPlayAgain: () => void;
  onMenu: () => void;
}

export function GameOverScreen({
  score,
  highScore,
  bestCombo,
  stats,
  lifetime,
  reason,
  onPlayAgain,
  onMenu,
}: GameOverScreenProps) {
  const isRecord = score > 0 && score >= highScore;

  return (
    <div className="no-select safe-area relative min-h-[100dvh] overflow-hidden">
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
              value={
                stats.avgReaction !== null ? `${stats.avgReaction}ms` : "—"
              }
              tone="text-neon-green glow-green"
            />
            <Stat
              label="FASTEST"
              value={
                stats.fastestReaction !== null
                  ? `${stats.fastestReaction}ms`
                  : "—"
              }
              tone="text-neon-green glow-green"
            />
            <Stat
              label="PERFECT"
              value={String(stats.perfect)}
              tone="text-neon-gold glow-gold"
            />
            <Stat
              label="TRAPS DODGED"
              value={String(stats.trapsAvoided)}
              tone="text-neon-red glow-red"
            />
          </div>

          <p className="sticker-sm mt-5 text-[10px] tracking-[0.18em] text-arcade-muted">
            {lifetime.gamesPlayed} RUNS · {lifetime.totalCorrect} HITS · BEST{" "}
            {lifetime.bestCombo}x
          </p>
        </div>

        <button
          type="button"
          onClick={onPlayAgain}
          className="arcade-btn sticker-sm mt-7 w-full bg-neon-green py-5 text-2xl tracking-tight text-arcade-bg-deep shadow-[0_0_40px_-8px_var(--neon-green)]"
        >
          Run It Back →
        </button>
        <button
          type="button"
          onClick={onMenu}
          className="arcade-btn sticker-sm mt-3 w-full border border-arcade-line bg-arcade-surface py-4 text-base text-arcade-text"
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
      <p className="sticker-sm text-[9px] tracking-[0.16em] text-arcade-muted">
        {label}
      </p>
      <p className={`sticker-sm mt-1 text-lg tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
