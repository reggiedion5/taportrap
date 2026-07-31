import { useState } from "react";
import type { TargetColor } from "@/game/types";

const DEMO_STYLE: Record<TargetColor, { bg: string; text: string; label: string }> = {
  green: { bg: "bg-neon-green", text: "text-arcade-bg-deep", label: "TAP" },
  red: { bg: "bg-neon-red", text: "text-arcade-text", label: "TRAP" },
  gold: { bg: "bg-neon-gold", text: "text-arcade-bg-deep", label: "BONUS" },
  purple: { bg: "bg-neon-purple", text: "text-arcade-text", label: "×2" },
};

interface Panel {
  title: string;
  points: string[];
  demo: TargetColor[];
}

const PANELS: Panel[] = [
  {
    title: "Tap the Targets",
    points: ["Green says TAP", "Gold says BONUS", "Tap each one once"],
    demo: ["green", "gold"],
  },
  {
    title: "Avoid the Traps",
    points: ["Red says TRAP", "Do not tap it", "Let it disappear on its own"],
    demo: ["red"],
  },
  {
    title: "Double Tap Purple",
    points: ["Purple says ×2", "Tap it twice before it disappears"],
    demo: ["purple"],
  },
  {
    title: "Build Your Combo",
    points: [
      "Correct reactions increase your multiplier",
      "Faster reactions earn stronger feedback",
      "One mistake ends the run",
    ],
    demo: ["green", "purple", "gold"],
  },
];

interface OnboardingFlowProps {
  reducedMotion: boolean;
  onFinish: () => void;
  onSkip: () => void;
}

/** Tutorial demos are purely visual — they never touch game statistics. */
export function OnboardingFlow({ reducedMotion, onFinish, onSkip }: OnboardingFlowProps) {
  const [index, setIndex] = useState(0);
  const panel = PANELS[index];
  const isLast = index === PANELS.length - 1;

  return (
    <div className="safe-area no-select relative flex min-h-[100dvh] flex-col bg-arcade-bg-deep px-5 py-8">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="flex items-center justify-between">
          <p className="sticker-sm text-[11px] tracking-[0.3em] text-arcade-text/80">
            HOW TO PLAY {index + 1}/{PANELS.length}
          </p>
          <button
            type="button"
            onClick={onSkip}
            className="arcade-btn ui-title min-h-11 border border-arcade-line bg-arcade-surface px-4 py-2 text-[15px] text-arcade-text"
          >
            Skip Tutorial
          </button>
        </div>

        <h1 className="sticker-text mt-10 text-[clamp(34px,10vw,52px)] leading-[0.95] text-arcade-text glow-white">
          {panel.title}
        </h1>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          {panel.demo.map((color, i) => {
            const style = DEMO_STYLE[color];
            const size =
              color === "purple"
                ? "text-[32px]"
                : color === "gold"
                  ? "text-[17px]"
                  : "text-[22px]";
            return (
              <span
                key={`${index}-${color}-${i}`}
                className={`grid size-28 place-items-center rounded-full ${style.bg} ${style.text} font-black tracking-widest ${size} ${
                  reducedMotion ? "" : "animate-pop-word"
                }`}
                style={{ animationDelay: `${i * 140}ms` }}
                aria-hidden
              >
                {style.label}
              </span>
            );
          })}
        </div>

        <ul className="arcade-panel mt-10 space-y-3 p-5">
          {panel.points.map((point) => (
            <li key={point} className="ui-body text-[16px] font-semibold text-arcade-text">
              • {point}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8">
          <div className="mb-4 flex justify-center gap-2" aria-hidden>
            {PANELS.map((p, i) => (
              <span
                key={p.title}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-8 bg-neon-green" : "w-2 bg-arcade-line"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => (isLast ? onFinish() : setIndex(index + 1))}
            className="arcade-btn sticker-sm w-full bg-neon-green py-5 text-xl tracking-tight text-arcade-bg-deep shadow-[0_0_40px_-8px_var(--neon-green)]"
          >
            {isLast ? "Start Playing →" : "Next →"}
          </button>
          {index > 0 && (
            <button
              type="button"
              onClick={() => setIndex(index - 1)}
              className="arcade-btn ui-title mt-3 min-h-12 w-full border border-arcade-line bg-arcade-surface py-4 text-base text-arcade-text"
            >
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
