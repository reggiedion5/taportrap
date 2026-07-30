import { Check, Lock } from "lucide-react";
import { GAME_MODES, MODE_CONFIG, type GameMode } from "@/game/modes";
import type { PersonalRecords } from "@/game/progressionTypes";
import type { PlayableMode, TrainingStore } from "@/game/trainingTypes";
import { MODE_CATALOG, TRAINING_DISCLAIMER, TRAINING_MODE_IDS } from "@/game/trainingConfig";
import { formatCount } from "@/game/format";
import { Sheet } from "./Sheet";

interface ModeSelectorProps {
  open: boolean;
  selected: PlayableMode;
  records: PersonalRecords;
  training: TrainingStore;
  onSelect: (mode: PlayableMode) => void;
  onClose: () => void;
}

function bestLabel(
  mode: PlayableMode,
  records: PersonalRecords,
  training: TrainingStore,
): string {
  if (mode === "zen") return `BEST ${formatCount(training.zen.bestTapCount)} TAPS`;
  if (mode === "trainer") {
    const best = Math.max(
      0,
      ...Object.values(training.trainer.modules).map((m) => m.bestAccuracy),
    );
    return `BEST ${Math.round(best * 100)}%`;
  }
  return `BEST ${formatCount(records.highScore[mode as GameMode])}`;
}

export function ModeSelector({
  open,
  selected,
  records,
  training,
  onSelect,
  onClose,
}: ModeSelectorProps) {
  const renderCard = (mode: PlayableMode) => {
    const entry = MODE_CATALOG[mode];
    const isSelected = mode === selected;
    const rules =
      entry.category === "competitive"
        ? MODE_CONFIG[mode as GameMode].rules
        : [entry.endLabel, entry.xpLabel];

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
          <span className={`sticker-sm text-lg tracking-tight ${entry.accentClass}`}>
            {entry.name}
          </span>
          {isSelected ? (
            <span className="sticker-sm flex items-center gap-1 text-[10px] tracking-[0.2em] text-neon-green glow-green">
              <Check className="size-4" aria-hidden /> SELECTED
            </span>
          ) : (
            <span className="sticker-sm shrink-0 text-[10px] tracking-[0.2em] text-arcade-text/70">
              {bestLabel(mode, records, training)}
            </span>
          )}
        </span>
        <span className="mt-2 block text-sm font-semibold text-arcade-text/85">
          {entry.category === "competitive"
            ? MODE_CONFIG[mode as GameMode].tagline
            : entry.description}
        </span>
        <span className="mt-3 block text-xs font-semibold text-arcade-text/70">
          {rules.join(" · ")}
        </span>
      </button>
    );
  };

  return (
    <Sheet open={open} title="Choose a Mode" onClose={onClose}>
      <section aria-label="Competitive modes">
        <h3 className="sticker-sm text-[11px] tracking-[0.26em] text-arcade-text/80">
          COMPETITIVE
        </h3>
        <p className="mt-1 text-xs font-semibold text-arcade-text/65">
          Counts towards high scores, achievements and full XP.
        </p>
        <div className="mt-3 grid gap-4">{GAME_MODES.map(renderCard)}</div>
      </section>

      <section className="mt-8" aria-label="Training modes">
        <h3 className="sticker-sm flex items-center gap-2 text-[11px] tracking-[0.26em] text-arcade-text/80">
          TRAINING & RELAX
        </h3>
        <p className="mt-1 text-xs font-semibold text-arcade-text/65">{TRAINING_DISCLAIMER}</p>
        <div className="mt-3 grid gap-4">{TRAINING_MODE_IDS.map(renderCard)}</div>
      </section>
    </Sheet>
  );
}

interface ModeInfoModalProps {
  open: boolean;
  mode: GameMode;
  onStart: () => void;
  onClose: () => void;
}

/** Shown the first time a player launches a given competitive mode. */
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

/** Small reminder badge used wherever a training result is displayed. */
export function TrainingBadge() {
  return (
    <p className="sticker-sm flex items-center justify-center gap-1 text-[10px] tracking-[0.18em] text-arcade-text/70">
      <Lock className="size-3" aria-hidden /> TRAINING — NOT COUNTED IN RANKINGS
    </p>
  );
}
