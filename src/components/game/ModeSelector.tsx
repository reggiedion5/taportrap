import { Check } from "lucide-react";
import { GAME_MODES, MODE_CONFIG, type GameMode } from "@/game/modes";
import type { PersonalRecords } from "@/game/progressionTypes";
import { Sheet } from "./Sheet";

interface ModeSelectorProps {
  open: boolean;
  selected: GameMode;
  records: PersonalRecords;
  onSelect: (mode: GameMode) => void;
  onClose: () => void;
}

export function ModeSelector({ open, selected, records, onSelect, onClose }: ModeSelectorProps) {
  return (
    <Sheet open={open} title="Choose a Mode" onClose={onClose}>
      <div className="grid gap-4">
        {GAME_MODES.map((mode) => {
          const config = MODE_CONFIG[mode];
          const isSelected = mode === selected;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => {
                onSelect(mode);
                onClose();
              }}
              aria-pressed={isSelected}
              className={`arcade-panel w-full p-5 text-left transition-colors ${
                isSelected ? "border-2 border-neon-green" : "border-arcade-line"
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="sticker-sm text-lg tracking-tight text-arcade-text">
                  {config.name}
                </span>
                {isSelected ? (
                  <span className="sticker-sm flex items-center gap-1 text-[10px] tracking-[0.2em] text-neon-green glow-green">
                    <Check className="size-4" aria-hidden /> SELECTED
                  </span>
                ) : (
                  <span className="sticker-sm text-[10px] tracking-[0.2em] text-arcade-text/70">
                    BEST {records.highScore[mode]}
                  </span>
                )}
              </span>
              <span className="mt-2 block text-sm font-semibold text-arcade-text/85">
                {config.tagline}
              </span>
              <span className="mt-3 block text-xs font-semibold text-arcade-text/70">
                {config.rules.join(" · ")}
              </span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

interface ModeInfoModalProps {
  open: boolean;
  mode: GameMode;
  onStart: () => void;
  onClose: () => void;
}

/** Shown the first time a player launches a given mode. */
export function ModeInfoModal({ open, mode, onStart, onClose }: ModeInfoModalProps) {
  if (!open) return null;
  const config = MODE_CONFIG[mode];
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-arcade-bg-deep/92 p-5"
      role="dialog"
      aria-modal="true"
      aria-label={`${config.name} rules`}
    >
      <div className="arcade-panel w-[min(92vw,420px)] p-6">
        <p className="sticker-sm text-[10px] tracking-[0.28em] text-arcade-text/75">MODE RULES</p>
        <h2 className="sticker-text mt-1 text-4xl text-neon-green glow-green">{config.name}</h2>
        <p className="mt-3 text-sm font-bold text-arcade-text">{config.description}</p>
        <ul className="mt-4 space-y-2">
          {config.rules.map((rule) => (
            <li key={rule} className="text-sm font-semibold text-arcade-text/90">
              • {rule}
            </li>
          ))}
        </ul>
        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={onStart}
            className="arcade-btn sticker-sm bg-neon-green py-4 text-lg text-arcade-bg-deep"
          >
            Got it — Play →
          </button>
          <button
            type="button"
            onClick={onClose}
            className="arcade-btn sticker-sm border border-arcade-line bg-arcade-surface py-3 text-base text-arcade-text"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
