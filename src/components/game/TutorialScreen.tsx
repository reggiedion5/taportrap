import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { TargetColor } from "@/game/types";
import { TUTORIAL_STEPS, TUTORIAL_XP, type TutorialStep } from "@/game/tutorial";

const TONE: Record<TargetColor, { bg: string; text: string; label: string; name: string }> = {
  green: { bg: "bg-neon-green", text: "text-arcade-bg-deep", label: "TAP", name: "Green target" },
  red: { bg: "bg-neon-red", text: "text-arcade-text", label: "TRAP", name: "Red trap" },
  gold: { bg: "bg-neon-gold", text: "text-arcade-bg-deep", label: "BONUS", name: "Gold bonus" },
  purple: { bg: "bg-neon-purple", text: "text-arcade-text", label: "×2", name: "Purple multiplier" },
};

interface TutorialScreenProps {
  reducedMotion: boolean;
  /** True when the 50 XP reward has already been paid out once. */
  rewardAlreadyGiven: boolean;
  onFinish: (result: { completed: boolean; xpAwarded: number }) => void;
  onExit: () => void;
}

/**
 * Interactive tutorial. Deliberately standalone: it shares the visual language
 * of gameplay but runs no scoring engine, so it can never write a score, a run
 * record, mission progress or a Game Over state.
 */
export function TutorialScreen({
  reducedMotion,
  rewardAlreadyGiven,
  onFinish,
  onExit,
}: TutorialScreenProps) {
  const [index, setIndex] = useState(0);
  const [reps, setReps] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const shownAt = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step: TutorialStep | undefined = TUTORIAL_STEPS[index];

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const advance = useCallback(() => {
    clearTimer();
    setIndex((prev) => {
      const next = prev + 1;
      if (next >= TUTORIAL_STEPS.length) {
        setDone(true);
        return prev;
      }
      return next;
    });
    setReps(0);
    shownAt.current = Date.now();
  }, []);

  // The "avoid" step resolves on its own once the trap safely expires.
  useEffect(() => {
    if (done || !step || step.action !== "avoid") return;
    shownAt.current = Date.now();
    timerRef.current = setTimeout(() => {
      setNote("Nice — you let the trap disappear.");
      advance();
    }, step.holdMs);
    return clearTimer;
  }, [advance, done, step]);

  useEffect(() => () => clearTimer(), []);

  if (done) {
    const xp = rewardAlreadyGiven ? 0 : TUTORIAL_XP;
    return (
      <section className="safe-area grid min-h-[100dvh] place-items-center bg-arcade-bg-deep px-6">
        <div className="arcade-panel w-full max-w-sm p-7 text-center">
          <h2 className="sticker-text text-3xl text-neon-green glow-green">Tutorial complete</h2>
          <p className="ui-body mt-4 text-[16px] text-arcade-text/95">
            You know the targets, the timing and the combo. Nothing here touched your scores or
            records.
          </p>
          <p className="ui-title mt-4 text-lg text-neon-gold">
            {xp > 0 ? `+${xp} XP earned` : "Reward already collected"}
          </p>
          <button
            type="button"
            onClick={() => onFinish({ completed: true, xpAwarded: xp })}
            className="arcade-btn sticker-sm mt-7 w-full bg-neon-green py-4 text-lg text-arcade-bg-deep"
          >
            Done
          </button>
        </div>
      </section>
    );
  }

  if (!step) return null;
  const tone = TONE[step.color];

  const handleTap = () => {
    if (step.action === "avoid") {
      setNote("That was a trap — wait for red targets to disappear on their own.");
      return;
    }
    if (step.action === "combo") {
      const next = reps + 1;
      if (next >= (step.repeat ?? 1)) {
        setNote("Combo ×3! Every clean tap raises your multiplier.");
        advance();
        return;
      }
      setReps(next);
      setNote(`Combo ×${next} — keep going.`);
      shownAt.current = Date.now();
      return;
    }
    if (step.action === "timed") {
      const reaction = Date.now() - shownAt.current;
      setNote(
        reaction <= 450
          ? `Perfect — ${reaction} ms.`
          : `${reaction} ms. Under 450 ms counts as Perfect.`,
      );
      advance();
      return;
    }
    setNote("Correct.");
    advance();
  };

  return (
    <section className="safe-area no-select flex min-h-[100dvh] flex-col bg-arcade-bg-deep px-5 py-6">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <p className="sticker-sm text-[11px] tracking-[0.3em] text-arcade-text/80">
            TUTORIAL {index + 1}/{TUTORIAL_STEPS.length}
          </p>
          <button
            type="button"
            onClick={onExit}
            aria-label="Exit tutorial"
            className="arcade-btn ui-title grid min-h-11 grid-cols-[auto_auto] items-center gap-2 border border-arcade-line bg-arcade-surface px-4 text-[15px] text-arcade-text"
          >
            <X className="size-4" aria-hidden />
            Exit
          </button>
        </div>

        <h2 className="sticker-text mt-6 text-[clamp(26px,7.5vw,38px)] leading-[1.05] text-arcade-text">
          {step.title}
        </h2>
        <p className="ui-body mt-3 text-[16px] text-arcade-text/95">{step.instruction}</p>

        <div className="mt-10 grid flex-1 place-items-center">
          <button
            type="button"
            onClick={handleTap}
            aria-label={`${tone.name} — ${step.instruction}`}
            className={`grid size-40 place-items-center rounded-full ${tone.bg} ${tone.text} font-black tracking-widest ring-4 ring-arcade-text/25 ${
              reducedMotion ? "" : "animate-pop-word"
            }`}
          >
            <span className="text-[22px]">{tone.label}</span>
          </button>
        </div>

        <p
          aria-live="polite"
          className="ui-body min-h-12 text-center text-[15px] text-arcade-muted"
        >
          {note}
        </p>

        <div className="mt-2 flex justify-center gap-2" aria-hidden>
          {TUTORIAL_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-8 bg-neon-green" : "w-2 bg-arcade-line"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
