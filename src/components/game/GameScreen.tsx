import { useEffect } from "react";
import { Heart } from "lucide-react";
import type { ActiveTarget, FloatingFeedback, TargetColor } from "@/game/types";
import type { DifficultyLevel } from "@/game/difficulty";
import type { GameMode } from "@/game/modes";
import { formatSeconds } from "@/game/format";
import { ArcadeBackdrop } from "./ArcadeBackdrop";
import { ScoreHeader } from "./ScoreHeader";
import { Target } from "./Target";
import { PauseOverlay } from "./PauseOverlay";
import { OrientationOverlay } from "./OrientationOverlay";
import { useOrientationGuard } from "@/hooks/useOrientationGuard";

const TONE_TEXT: Record<TargetColor, string> = {
  green: "text-neon-green glow-green",
  red: "text-neon-red glow-red",
  gold: "text-neon-gold glow-gold",
  purple: "text-neon-purple glow-purple",
};

interface GameScreenProps {
  mode: GameMode;
  score: number;
  highScore: number;
  combo: number;
  multiplier: number;
  scorePulse: number;
  difficultyLabel: string;
  comboFlash: number | null;
  milestone: { id: number; label: string } | null;
  pulse: number;
  perfectFlash: boolean;
  greatFlash: boolean;
  levelUp: DifficultyLevel | null;
  target: ActiveTarget | null;
  feedback: FloatingFeedback[];
  burst: { id: number; x: number; y: number } | null;
  paused: boolean;
  pauseSource: "manual" | "system";
  shake: boolean;
  flash: boolean;
  reducedMotion: boolean;
  timeLeft: number | null;
  lives: number | null;
  lifeLost: boolean;
  avgReaction: number | null;
  runStatsSuccesses: number;
  registerArea: (el: HTMLDivElement | null) => void;
  onTap: () => void;
  onPause: () => void;
  onResume: () => void;
  onQuit: () => void;
}

export function GameScreen(props: GameScreenProps) {
  const {
    mode,
    target,
    feedback,
    burst,
    paused,
    pauseSource,
    shake,
    flash,
    reducedMotion,
    timeLeft,
    lives,
    lifeLost,
    avgReaction,
    registerArea,
    onTap,
    onPause,
    onResume,
    onQuit,
  } = props;

  const needsRotate = useOrientationGuard(true);

  // Landscape on a phone pauses the run rather than ending it.
  useEffect(() => {
    if (needsRotate && !paused) onPause();
  }, [needsRotate, paused, onPause]);

  const urgent = timeLeft !== null && timeLeft <= 10_000;

  console.info("[loss-debug] GameScreen render", {
    phase: paused ? "paused" : "playing",
    score: props.score,
    bestScore: props.highScore,
    lives,
    currentRound: props.runStatsSuccesses,
    animationFlags: { shake, flash, lifeLost },
    conditionalBranches: {
      target: target !== null && !paused,
      paused,
      orientationOverlay: needsRotate,
      lifeLost,
    },
  });

  return (
    <div
      className={`no-select safe-screen relative flex flex-col overflow-hidden ${
        shake && !reducedMotion ? "animate-shake-hit" : ""
      }`}
      style={{ touchAction: "manipulation" }}
    >
      <ArcadeBackdrop />
      {flash && !reducedMotion && (
        <div className="animate-flash-red pointer-events-none absolute inset-0 z-40 bg-neon-red" />
      )}
      {props.perfectFlash && !reducedMotion && (
        <div className="pointer-events-none absolute inset-0 z-30 bg-neon-gold/25 transition-opacity" />
      )}
      {props.greatFlash && !reducedMotion && (
        <div className="pointer-events-none absolute inset-0 z-30 bg-neon-green/15 transition-opacity" />
      )}
      {urgent && !reducedMotion && !paused && (
        <div className="pointer-events-none absolute inset-0 z-10 animate-pulse bg-[radial-gradient(circle,transparent_55%,color-mix(in_oklab,var(--neon-red)_28%,transparent))]" />
      )}

      <div
        key={reducedMotion ? undefined : props.pulse}
        className={`relative mx-auto flex w-full max-w-lg flex-1 flex-col ${
          props.pulse > 0 && !reducedMotion ? "animate-score-bump" : ""
        }`}
      >
        <ScoreHeader
          score={props.score}
          highScore={props.highScore}
          multiplier={props.multiplier}
          combo={props.combo}
          scorePulse={props.scorePulse}
          difficultyLabel={props.difficultyLabel}
          onPause={props.onPause}
        />

        {(timeLeft !== null || lives !== null || mode === "focus") && (
          <div className="relative z-20 mt-2 flex items-center justify-between gap-3 px-4">
            {timeLeft !== null && (
              <p
                className={`sticker-sm text-4xl leading-none tabular-nums ${
                  urgent
                    ? `text-neon-red glow-red ${reducedMotion ? "" : "animate-score-bump"}`
                    : "text-arcade-text glow-white"
                }`}
                aria-label="Time remaining"
              >
                {formatSeconds(timeLeft)}s
              </p>
            )}
            {lives !== null && (
              <p className="flex items-center gap-1" aria-label={`${lives} lives left`}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`size-6 ${
                      i < lives ? "fill-neon-red text-neon-red" : "text-arcade-line"
                    }`}
                    aria-hidden
                  />
                ))}
              </p>
            )}
            {mode === "focus" && (
              <p className="sticker-sm text-sm tracking-[0.16em] text-neon-green glow-green tabular-nums">
                AVG {avgReaction !== null ? `${avgReaction}ms` : "—"}
              </p>
            )}
          </div>
        )}

        <div
          ref={registerArea}
          className="relative mx-3 mt-4 mb-4 flex-1 overflow-hidden rounded-3xl border border-arcade-line/60 bg-arcade-bg/40"
        >
          {target && !paused && (
            <Target target={target} disabled={paused} reducedMotion={reducedMotion} onTap={onTap} />
          )}

          {feedback.map((f) => (
            <span
              key={f.id}
              className={`sticker-sm animate-float-up pointer-events-none absolute -translate-x-1/2 text-center text-xl tracking-wide ${TONE_TEXT[f.tone]}`}
              style={{ left: f.x, top: f.y }}
            >
              {f.text}
              {f.sub && (
                <span className="block text-[10px] tracking-[0.2em] opacity-80">{f.sub}</span>
              )}
            </span>
          ))}

          {burst &&
            !reducedMotion &&
            Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              return (
                <span
                  key={`${burst.id}-${i}`}
                  className="pointer-events-none absolute size-2 rounded-full bg-neon-gold"
                  style={
                    {
                      left: burst.x,
                      top: burst.y,
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

          {props.milestone && (
            <span
              key={props.milestone.id}
              className={`sticker-text pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 text-center text-3xl text-neon-gold glow-gold ${
                reducedMotion ? "" : "animate-float-up"
              }`}
            >
              {props.milestone.label}
            </span>
          )}

          {props.levelUp && props.levelUp.level > 1 && (
            <span className="sticker-sm animate-float-up pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 text-xs tracking-[0.3em] text-neon-gold glow-gold">
              LEVEL {props.levelUp.level} · {props.levelUp.label.toUpperCase()}
            </span>
          )}

          {lifeLost && !paused && (
            <span className="sticker-text pointer-events-none absolute inset-0 grid place-items-center text-4xl text-neon-red glow-red">
              LIFE LOST
            </span>
          )}

          {!target && !paused && !lifeLost && (
            <span className="sticker-sm pointer-events-none absolute inset-0 grid place-items-center text-sm tracking-[0.3em] text-arcade-text/75">
              GET READY…
            </span>
          )}

          {paused && (
            <PauseOverlay source={pauseSource} onResume={onResume} onQuit={onQuit} />
          )}
          {needsRotate && <OrientationOverlay />}
        </div>
      </div>
    </div>
  );
}
