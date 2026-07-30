import { Pause } from "lucide-react";
import { difficultyProgress } from "@/game/useGame";

interface ScoreHeaderProps {
  score: number;
  highScore: number;
  multiplier: number;
  combo: number;
  scorePulse: number;
  onPause: () => void;
}

export function ScoreHeader({
  score,
  highScore,
  multiplier,
  combo,
  scorePulse,
  onPause,
}: ScoreHeaderProps) {
  const diff = difficultyProgress(score);

  return (
    <header className="no-select relative z-20 px-4 pt-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-end gap-5">
          <div className="min-w-0">
            <p className="sticker-sm text-[10px] tracking-[0.22em] text-arcade-text/80">
              SCORE
            </p>
            <p
              key={scorePulse}
              className="sticker-sm animate-score-bump text-4xl leading-none text-arcade-text glow-white tabular-nums"
            >
              {score}
            </p>
          </div>
          <div className="min-w-0">
            <p className="sticker-sm text-[10px] tracking-[0.22em] text-arcade-text/80">
              BEST
            </p>
            <p className="sticker-sm text-lg leading-none text-neon-gold glow-gold tabular-nums">
              {highScore}
            </p>
          </div>
          <div className="min-w-0">
            <p className="sticker-sm text-[10px] tracking-[0.22em] text-arcade-text/80">
              COMBO
            </p>
            <p
              className={`sticker-sm text-lg leading-none tabular-nums ${
                multiplier > 1
                  ? "text-neon-purple glow-purple"
                  : "text-arcade-text"
              }`}
            >
              {combo}{" "}
              <span
                key={multiplier}
                className={
                  multiplier > 1 ? "animate-score-bump inline-block" : ""
                }
              >
                ×{multiplier}
              </span>
            </p>
          </div>

        </div>
        <button
          type="button"
          onClick={onPause}
          aria-label="Pause game"
          className="arcade-btn grid size-12 shrink-0 place-items-center border border-arcade-line bg-arcade-surface text-arcade-text"
        >
          <Pause className="size-5" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="sticker-sm shrink-0 text-[10px] tracking-[0.2em] text-arcade-text/80">
          {diff.label.toUpperCase()}
        </span>
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-arcade-surface">
          <div
            className="h-full rounded-full bg-gradient-to-r from-neon-green to-neon-gold transition-all duration-300"
            style={{ width: `${Math.round(diff.progress * 100)}%` }}
          />
        </div>
        <span
          className={`sticker-sm shrink-0 text-[10px] tracking-[0.2em] ${diff.isMax ? "text-neon-gold glow-gold" : "text-arcade-text/80"}`}
        >
          {diff.isMax ? "MAX!" : "NEXT"}
        </span>
      </div>
    </header>
  );
}
