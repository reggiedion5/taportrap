import { Pause } from "lucide-react";
import { difficultyProgress } from "@/game/useGame";
import { ChromeBadge } from "./ArcUI";

interface ScoreHeaderProps {
  score: number;
  highScore: number;
  multiplier: number;
  combo: number;
  scorePulse: number;
  difficultyLabel: string;
  onPause: () => void;
}

export function ScoreHeader({
  score,
  highScore,
  multiplier,
  combo,
  scorePulse,
  difficultyLabel,
  onPause,
}: ScoreHeaderProps) {
  const diff = difficultyProgress(score);

  return (
    <header className="no-select relative z-20 px-4 pt-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <ChromeBadge faceClassName="flex-col items-start gap-0 px-3.5 py-1.5">
            <span className="ui-title text-[9px] tracking-[0.22em] text-arcade-muted">SCORE</span>
            <span key={scorePulse} className="score-digits animate-score-bump text-3xl leading-none">
              {score}
            </span>
          </ChromeBadge>
          <ChromeBadge faceClassName="flex-col items-start gap-0 px-3 py-1.5">
            <span className="ui-title text-[9px] tracking-[0.22em] text-arcade-muted">BEST</span>
            <span className="score-digits text-base leading-none">{highScore}</span>
          </ChromeBadge>
          <ChromeBadge faceClassName="flex-col items-start gap-0 px-3 py-1.5">
            <span className="ui-title text-[9px] tracking-[0.22em] text-arcade-muted">COMBO</span>
            <span
              className={`ui-title text-base leading-none tabular-nums ${
                multiplier > 1 ? "text-neon-purple glow-purple" : "text-arcade-text"
              }`}
            >
              {combo}{" "}
              <span
                key={multiplier}
                className={multiplier > 1 ? "animate-score-bump inline-block" : ""}
              >
                ×{multiplier}
              </span>
            </span>
          </ChromeBadge>
        </div>
        <button
          type="button"
          onClick={onPause}
          aria-label="Pause game"
          className="btn-arc chrome-badge shrink-0"
        >
          <span className="chrome-badge-face grid size-12 place-items-center">
            <Pause className="icon-chrome size-5" />
          </span>
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="ui-title shrink-0 text-[10px] tracking-[0.2em] text-arcade-muted">
          {diff.label.toUpperCase()}
        </span>
        <span className="ui-title shrink-0 text-[10px] tracking-[0.2em] text-logo-green">
          {difficultyLabel.toUpperCase()}
        </span>
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full border border-arcade-line/70 bg-arcade-bg-deep shadow-[inset_0_1px_3px_oklch(0_0_0_/_0.8)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--logo-green),var(--logo-gold))] shadow-[0_0_12px_var(--logo-green)] transition-all duration-300"
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
