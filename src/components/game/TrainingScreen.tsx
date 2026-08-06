import { useEffect, useRef, useState } from "react";
import { Pause } from "lucide-react";
import { useTrainingSession } from "@/game/useTrainingSession";
import { KIDS_ASSIST_CONFIG, TRAINER_MODULES, TRAINER_TIMING } from "@/game/trainingConfig";
import type {
  TrainerSessionResult,
  TrainingDifficulty,
  TrainingMode,
  TrainingModule,
  ZenSessionResult,
} from "@/game/trainingTypes";
import type { AreaBounds } from "@/game/positioning";
import type { TargetColor } from "@/game/types";
import { ArcadeBackdrop } from "./ArcadeBackdrop";
import { Target } from "./Target";
import { CountdownOverlay } from "./CountdownOverlay";
import { PauseOverlay } from "./PauseOverlay";

const TONE_TEXT: Record<TargetColor, string> = {
  green: "text-neon-green glow-green",
  red: "text-neon-red glow-red",
  gold: "text-neon-gold glow-gold",
  purple: "text-neon-purple glow-purple",
};

interface TrainingScreenProps {
  mode: TrainingMode;
  module: TrainingModule;
  difficulty: TrainingDifficulty;
  kidsAssist: boolean;
  reducedMotion: boolean;
  shortCountdown: boolean;
  /** Practice runs never write records, XP or statistics. */
  practice?: boolean;
  onZenComplete: (result: ZenSessionResult) => void;
  onTrainerComplete: (result: TrainerSessionResult) => void;
  onQuit: () => void;
}

/** Play surface for Zen Mode and the Reflex Trainer. */
export function TrainingScreen(props: TrainingScreenProps) {
  const { mode, module, difficulty, kidsAssist, reducedMotion } = props;
  const areaRef = useRef<HTMLDivElement | null>(null);
  const [bounds, setBounds] = useState<AreaBounds | null>(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setBounds({ width: rect.width, height: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const session = useTrainingSession({
    mode,
    module,
    difficulty,
    kidsAssist,
    bounds,
    reducedMotion,
    shortCountdown: props.shortCountdown,
    onZenComplete: props.onZenComplete,
    onTrainerComplete: props.onTrainerComplete,
  });

  const moduleConfig = TRAINER_MODULES[module];
  const paused = session.phase === "paused";

  return (
    <div className="no-select safe-screen relative flex flex-col overflow-hidden">
      <ArcadeBackdrop />
      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 pt-3">
          <div className="min-w-0">
            <p className="sticker-sm text-[11px] tracking-[0.2em] text-arcade-muted">
              {props.practice
                ? "PRACTICE · NOT RECORDED"
                : mode === "zen"
                  ? kidsAssist
                    ? "ZEN · KIDS ASSIST"
                    : "ZEN MODE"
                  : "REFLEX TRAINER"}
            </p>
            <p className="truncate text-sm font-black tracking-tight text-arcade-text">
              {mode === "zen"
                ? "Relax and tap the green targets"
                : `${moduleConfig.name} · ${TRAINER_TIMING[difficulty].name}`}
            </p>
          </div>
          <button
            type="button"
            onClick={session.pause}
            aria-label="Pause session"
            className="arcade-btn grid size-11 shrink-0 place-items-center border border-arcade-line bg-arcade-surface text-arcade-text"
          >
            <Pause className="size-5" aria-hidden />
          </button>
        </header>

        <div className="mt-2 flex items-center justify-between gap-3 px-4">
          {mode === "zen" ? (
            <>
              <p className="sticker-sm text-4xl leading-none text-neon-green glow-green tabular-nums">
                {session.taps}
                <span className="ml-2 text-[12px] tracking-[0.16em] text-arcade-muted">TAPS</span>
              </p>
              {!kidsAssist && (
                <p className="sticker-sm text-sm tracking-[0.16em] text-arcade-text/80 tabular-nums">
                  STREAK {session.streak}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="sticker-sm text-2xl leading-none text-arcade-text tabular-nums">
                {session.progress?.current ?? 0}
                <span className="text-arcade-text/60">/{session.progress?.total ?? 0}</span>
              </p>
              <p className="sticker-sm text-sm tracking-[0.16em] text-neon-green glow-green tabular-nums">
                {Math.round(session.accuracy * 100)}% ACCURATE
              </p>
            </>
          )}
        </div>

        {mode === "trainer" && (
          <p className="ui-body-tight mt-1 px-4 text-[14px] text-arcade-muted">{moduleConfig.rule}</p>
        )}

        <div
          ref={areaRef}
          className="relative mx-3 mt-3 mb-3 flex-1 overflow-hidden rounded-3xl border border-arcade-line/60 bg-arcade-bg/40"
        >
          {session.target && session.phase === "playing" && (
            <Target
              target={session.target}
              disabled={false}
              reducedMotion={reducedMotion}
              onTap={() => session.target && session.handleTap(session.target.id)}
            />
          )}

          {session.feedbacks.map((f) => (
            <span
              key={f.id}
              className={`sticker-sm animate-float-up pointer-events-none absolute -translate-x-1/2 text-center text-xl tracking-wide ${TONE_TEXT[f.tone]}`}
              style={{ left: f.x, top: f.y }}
            >
              {f.text}
              {f.sub && (
                <span className="block text-[11px] tracking-[0.16em] opacity-90">{f.sub}</span>
              )}
            </span>
          ))}

          {session.phase === "countdown" && (
            <CountdownOverlay label={session.countdownLabel} reducedMotion={reducedMotion} />
          )}

          {paused && (
            <PauseOverlay source="manual" onResume={session.resume} onQuit={session.endSession} />
          )}

          {session.phase === "playing" && !session.target && (
            <span className="sticker-sm pointer-events-none absolute inset-0 grid place-items-center text-sm tracking-[0.3em] text-arcade-text/70">
              {mode === "zen" ? "BREATHE…" : "GET READY…"}
            </span>
          )}
        </div>

        <div className="px-4 pb-4">
          {session.coachMessage && (
            <p
              className="mb-3 rounded-2xl border border-arcade-line bg-arcade-surface px-4 py-3 text-center text-[15px] font-semibold text-arcade-text"
              aria-live="polite"
            >
              {session.coachMessage}
            </p>
          )}
          {mode === "zen" && (
            <button
              type="button"
              onClick={session.endSession}
              className="arcade-btn sticker-sm min-h-14 w-full border border-arcade-line bg-arcade-surface py-4 text-base text-arcade-text"
            >
              Finish Session
            </button>
          )}
          {mode === "zen" && kidsAssist && (
            <p className="ui-body mt-2 text-center text-[13px] text-arcade-muted">
              {KIDS_ASSIST_CONFIG.note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
