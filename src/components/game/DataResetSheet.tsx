import { useState } from "react";
import { Sheet } from "./Sheet";
import { ConfirmationModal } from "./ConfirmationModal";

export type ResetScope = "statistics" | "training" | "daily" | "everything";

interface ResetOption {
  id: ResetScope;
  label: string;
  summary: string;
  bullets: string[];
  danger: boolean;
}

const OPTIONS: ResetOption[] = [
  {
    id: "statistics",
    label: "Statistics & Records",
    summary: "Competitive stats, high scores and achievements.",
    bullets: [
      "All lifetime and per-mode statistics",
      "All personal records and high scores",
      "All unlocked achievements",
      "Training data, settings and themes are kept",
    ],
    danger: false,
  },
  {
    id: "training",
    label: "Training Data",
    summary: "Zen and Reflex Trainer records only.",
    bullets: [
      "Zen session history and best tap counts",
      "Reflex Trainer accuracy and reaction records",
      "Competitive scores and achievements are kept",
      "XP already earned from training is not removed",
    ],
    danger: false,
  },
  {
    id: "daily",
    label: "Daily Challenge Progress",
    summary: "Today's progress and your streak.",
    bullets: [
      "Today's challenge progress",
      "Current and best daily streak",
      "XP already claimed for past days is not removed",
    ],
    danger: false,
  },
  {
    id: "everything",
    label: "Everything",
    summary: "Delete all local data and start completely fresh.",
    bullets: [
      "Every statistic, record and achievement",
      "All training data and daily streaks",
      "XP, level, unlocked themes and settings",
      "Tutorial progress — onboarding runs again",
    ],
    danger: true,
  },
];

interface DataResetSheetProps {
  open: boolean;
  onReset: (scope: ResetScope) => void;
  onClose: () => void;
}

/** Granular, individually confirmed resets. */
export function DataResetSheet({ open, onReset, onClose }: DataResetSheetProps) {
  const [pending, setPending] = useState<ResetOption | null>(null);

  return (
    <Sheet open={open} title="Reset Data" onClose={onClose}>
      <p className="text-sm font-semibold text-arcade-text/85">
        Everything is stored only on this device. Choose exactly what to remove — each option is
        confirmed separately and cannot be undone.
      </p>

      <div className="mt-5 grid gap-3">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setPending(option)}
            className={`rounded-2xl border px-4 py-4 text-left ${
              option.danger
                ? "border-neon-red/60 bg-arcade-surface"
                : "border-arcade-line bg-arcade-surface/70"
            }`}
          >
            <span
              className={`block text-base font-black ${
                option.danger ? "text-neon-red" : "text-arcade-text"
              }`}
            >
              {option.label}
            </span>
            <span className="mt-0.5 block text-xs font-semibold text-arcade-text/75">
              {option.summary}
            </span>
          </button>
        ))}
      </div>

      <ConfirmationModal
        open={pending !== null}
        title={pending ? `Reset ${pending.label}?` : ""}
        body="This permanently deletes the following from this device."
        bullets={pending?.bullets ?? []}
        confirmLabel={pending ? `Reset ${pending.label}` : "Reset"}
        doubleConfirm={pending?.danger ?? false}
        onConfirm={() => {
          if (pending) onReset(pending.id);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </Sheet>
  );
}
