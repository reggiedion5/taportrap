import { useState } from "react";
import { ChevronDown, Settings2 } from "lucide-react";
import type { GameSettings } from "@/game/types";
import { ArcadeBackdrop } from "./ArcadeBackdrop";

const RULES = [
  {
    color: "bg-neon-green",
    text: "text-arcade-bg-deep",
    label: "TAP",
    title: "Green",
    tone: "text-neon-green glow-green",
    detail: "Smash it. +1 point.",
  },
  {
    color: "bg-neon-red",
    text: "text-arcade-text",
    label: "TRAP",
    title: "Red",
    tone: "text-neon-red glow-red",
    detail: "Hands off. Let it die. +1 point.",
  },
  {
    color: "bg-neon-gold",
    text: "text-arcade-bg-deep",
    label: "BONUS",
    title: "Gold",
    tone: "text-neon-gold glow-gold",
    detail: "Rare treasure. +3 points.",
  },
  {
    color: "bg-neon-purple",
    text: "text-arcade-text",
    label: "×2",
    title: "Purple",
    tone: "text-neon-purple glow-purple",
    detail: "Two taps, fast — or you're done.",
  },
];


interface StartScreenProps {
  highScore: number;
  settings: GameSettings;
  onSettingsChange: (next: Partial<GameSettings>) => void;
  onStart: () => void;
  onOpenSettings: () => void;
}

export function StartScreen({
  highScore,
  onStart,
  onOpenSettings,
}: StartScreenProps) {
  const [howOpen, setHowOpen] = useState(false);

  return (
    <div className="no-select relative min-h-[100dvh] overflow-hidden">
      <ArcadeBackdrop />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-5 py-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <p className="sticker-sm truncate text-[11px] tracking-[0.32em] text-arcade-muted">
            REACTION ARCADE
          </p>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            className="arcade-btn grid size-11 shrink-0 place-items-center border border-arcade-line bg-arcade-surface text-arcade-text"
          >
            <Settings2 className="size-5" />
          </button>
        </div>

        <div className="mt-10">
          <h1 className="sticker-text flex flex-wrap items-end gap-x-3 text-[clamp(46px,15vw,76px)] leading-[0.88]">
            <span
              className="animate-pop-word text-neon-green glow-green"
              style={{ "--rot": "-4deg" } as React.CSSProperties}
            >
              Tap
            </span>
            <span
              className="animate-pop-word text-[0.55em] text-arcade-text glow-white"
              style={
                {
                  "--rot": "6deg",
                  animationDelay: "90ms",
                } as React.CSSProperties
              }
            >
              or
            </span>
            <span
              className="animate-pop-word text-neon-red glow-red"
              style={
                {
                  "--rot": "3deg",
                  animationDelay: "180ms",
                } as React.CSSProperties
              }
            >
              Trap
            </span>
          </h1>
          <p className="mt-4 text-lg font-black tracking-tight text-arcade-text">
            Green good. Red bad.{" "}
            <span className="text-neon-green glow-green">Don't blink.</span>
          </p>
        </div>

        <div className="arcade-panel mt-7 divide-y divide-arcade-line/50">
          {RULES.map((r) => (
            <div key={r.title} className="flex items-center gap-4 p-4">
              <span
                className={`grid size-14 shrink-0 place-items-center rounded-full ${r.color} ${r.text} text-[11px] font-black tracking-wider`}
              >
                {r.label}
              </span>
              <span className="min-w-0">
                <span
                  className={`sticker-sm block text-base tracking-tight ${r.tone}`}
                >
                  {r.title}
                </span>
                <span className="block text-sm font-semibold text-arcade-muted">
                  {r.detail}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl border border-arcade-line bg-arcade-surface px-5 py-4">
          <span className="sticker-sm text-xs tracking-[0.22em] text-arcade-muted">
            HIGH SCORE
          </span>
          <span className="sticker-sm text-3xl text-neon-gold glow-gold tabular-nums">
            {highScore}
          </span>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="arcade-btn sticker-sm mt-6 w-full bg-neon-green py-5 text-2xl tracking-tight text-arcade-bg-deep shadow-[0_0_40px_-8px_var(--neon-green)]"
        >
          <span className="animate-wiggle">Let's Go →</span>
        </button>

        <div className="mt-5 mb-2">
          <button
            type="button"
            onClick={() => setHowOpen((v) => !v)}
            aria-expanded={howOpen}
            className="flex w-full items-center justify-between rounded-2xl border border-arcade-line bg-arcade-surface/60 px-5 py-4 text-left"
          >
            <span className="sticker-sm text-sm tracking-tight text-arcade-text">
              How to Play
            </span>
            <ChevronDown
              className={`size-4 text-arcade-muted transition-transform ${howOpen ? "rotate-180" : ""}`}
            />
          </button>
          {howOpen && (
            <div className="mt-2 space-y-2 rounded-2xl border border-arcade-line bg-arcade-surface/40 p-5 text-sm leading-relaxed font-semibold text-arcade-muted">
              <p>
                One target at a time. Nail them back to back and the combo
                stacks:{" "}
                <span className="text-neon-purple glow-purple">5 = ×2</span>,{" "}
                <span className="text-neon-purple glow-purple">10 = ×3</span>,{" "}
                <span className="text-neon-purple glow-purple">20 = ×4</span>.
              </p>
              <p>
                One slip and it's over — tap a trap, miss a target, or leave
                purple hanging on one tap.
              </p>
              <p>
                It gets nastier fast: 1.4s down to 0.65s. Under 250ms and you
                earn a{" "}
                <span className="text-neon-green glow-green">PERFECT!</span>
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
