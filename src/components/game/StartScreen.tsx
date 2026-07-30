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
    detail: "Tap once — 1 point",
  },
  {
    color: "bg-neon-red",
    text: "text-arcade-text",
    label: "TRAP",
    title: "Red",
    detail: "Don't tap — let it vanish for 1 point",
  },
  {
    color: "bg-neon-gold",
    text: "text-arcade-bg-deep",
    label: "BONUS",
    title: "Gold",
    detail: "Tap once — 3 points, appears rarely",
  },
  {
    color: "bg-neon-purple",
    text: "text-arcade-text",
    label: "×2",
    title: "Purple",
    detail: "Tap twice fast — 2 points",
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
          <p className="truncate text-[11px] font-bold tracking-[0.3em] text-arcade-muted">
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
          <h1 className="text-[clamp(44px,14vw,72px)] leading-[0.9] font-black tracking-tighter text-arcade-text">
            <span className="text-neon-green">Tap</span>
            <span className="text-arcade-text"> or </span>
            <span className="text-neon-red">Trap</span>
          </h1>
          <p className="mt-3 text-lg font-semibold text-arcade-muted">
            Tap fast. Think faster.
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
                <span className="block text-base font-black text-arcade-text">
                  {r.title}
                </span>
                <span className="block text-sm font-medium text-arcade-muted">
                  {r.detail}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl border border-arcade-line bg-arcade-surface px-5 py-4">
          <span className="text-xs font-bold tracking-[0.2em] text-arcade-muted">
            HIGH SCORE
          </span>
          <span className="text-2xl font-black text-neon-gold tabular-nums">
            {highScore}
          </span>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="arcade-btn mt-6 w-full bg-neon-green py-5 text-xl text-arcade-bg-deep shadow-[0_0_40px_-8px_var(--neon-green)]"
        >
          Start Game
        </button>

        <div className="mt-5 mb-2">
          <button
            type="button"
            onClick={() => setHowOpen((v) => !v)}
            aria-expanded={howOpen}
            className="flex w-full items-center justify-between rounded-2xl border border-arcade-line bg-arcade-surface/60 px-5 py-4 text-left"
          >
            <span className="text-sm font-bold text-arcade-text">
              How to Play
            </span>
            <ChevronDown
              className={`size-4 text-arcade-muted transition-transform ${howOpen ? "rotate-180" : ""}`}
            />
          </button>
          {howOpen && (
            <div className="mt-2 space-y-2 rounded-2xl border border-arcade-line bg-arcade-surface/40 p-5 text-sm leading-relaxed font-medium text-arcade-muted">
              <p>
                One target appears at a time. React correctly and your combo
                grows: 5 in a row is ×2, 10 is ×3, 20 is ×4.
              </p>
              <p>
                A single mistake ends the run — tapping a trap, missing a
                target, or leaving purple on one tap.
              </p>
              <p>
                Targets shrink in time as your score climbs, from 1.4s down to
                0.65s. Under 250ms reactions score a PERFECT.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
