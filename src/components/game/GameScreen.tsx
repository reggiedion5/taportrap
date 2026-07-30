import type { ActiveTarget, FloatingFeedback, TargetColor } from "@/game/types";
import { ArcadeBackdrop } from "./ArcadeBackdrop";
import { ScoreHeader } from "./ScoreHeader";
import { Target } from "./Target";
import { PauseOverlay } from "./PauseOverlay";

const TONE_TEXT: Record<TargetColor, string> = {
  green: "text-neon-green glow-green",
  red: "text-neon-red glow-red",
  gold: "text-neon-gold glow-gold",
  purple: "text-neon-purple glow-purple",
};

interface GameScreenProps {
  score: number;
  highScore: number;
  combo: number;
  multiplier: number;
  scorePulse: number;
  comboFlash: number | null;
  target: ActiveTarget | null;
  feedback: FloatingFeedback[];
  burst: { id: number; x: number; y: number } | null;
  paused: boolean;
  shake: boolean;
  flash: boolean;
  onTap: () => void;
  onPause: () => void;
  onResume: () => void;
  onQuit: () => void;
}

export function GameScreen(props: GameScreenProps) {
  const {
    target,
    feedback,
    burst,
    paused,
    shake,
    flash,
    onTap,
    onResume,
    onQuit,
  } = props;

  return (
    <div
      className={`no-select relative flex min-h-[100dvh] flex-col overflow-hidden ${
        shake ? "animate-shake-hit" : ""
      }`}
    >
      <ArcadeBackdrop />
      {flash && (
        <div className="animate-flash-red pointer-events-none absolute inset-0 z-40 bg-neon-red" />
      )}

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col">
        <ScoreHeader
          score={props.score}
          highScore={props.highScore}
          multiplier={props.multiplier}
          combo={props.combo}
          scorePulse={props.scorePulse}
          onPause={props.onPause}
        />

        <div className="relative mx-3 mt-4 mb-4 flex-1 overflow-hidden rounded-3xl border border-arcade-line/60 bg-arcade-bg/40">
          {target && !paused && (
            <Target target={target} disabled={paused} onTap={onTap} />
          )}

          {feedback.map((f) => (
            <span
              key={f.id}
              className={`sticker-sm animate-float-up pointer-events-none absolute text-xl tracking-wide ${TONE_TEXT[f.tone]}`}
              style={{ left: `${f.x}%`, top: `${f.y}%` }}
            >
              {f.text}
            </span>
          ))}

          {burst &&
            Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              return (
                <span
                  key={`${burst.id}-${i}`}
                  className="pointer-events-none absolute size-2 rounded-full bg-neon-gold"
                  style={
                    {
                      left: `${burst.x}%`,
                      top: `${burst.y}%`,
                      "--px": `${Math.cos(angle) * 90}px`,
                      "--py": `${Math.sin(angle) * 90}px`,
                      animation: "particle-fly 650ms ease-out both",
                    } as React.CSSProperties
                  }
                />
              );
            })}

          {props.comboFlash && (
            <span className="sticker-text animate-combo-burst pointer-events-none absolute top-1/2 left-1/2 text-7xl text-neon-purple glow-purple">
              ×{props.comboFlash}
            </span>
          )}

          {!target && !paused && (
            <span className="sticker-sm pointer-events-none absolute inset-0 grid place-items-center text-sm tracking-[0.3em] text-arcade-muted">
              GET READY…
            </span>
          )}

          {paused && <PauseOverlay onResume={onResume} onQuit={onQuit} />}
        </div>
      </div>
    </div>
  );
}
