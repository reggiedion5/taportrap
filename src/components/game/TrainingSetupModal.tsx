import {
  KIDS_ASSIST_CONFIG,
  MODE_CATALOG,
  TRAINER_MODULES,
  TRAINER_TIMING,
  TRAINING_DISCLAIMER,
  ZEN_CONFIG,
} from "@/game/trainingConfig";
import {
  TRAINING_DIFFICULTIES,
  TRAINING_MODULES,
  type TrainingDifficulty,
  type TrainingMode,
  type TrainingModule,
  type TrainingStore,
} from "@/game/trainingTypes";
import { Sheet } from "./Sheet";

interface TrainingSetupModalProps {
  open: boolean;
  mode: TrainingMode;
  module: TrainingModule;
  difficulty: TrainingDifficulty;
  kidsAssist: boolean;
  training: TrainingStore;
  onModuleChange: (module: TrainingModule) => void;
  onDifficultyChange: (difficulty: TrainingDifficulty) => void;
  onKidsAssistChange: (value: boolean) => void;
  onStart: () => void;
  onClose: () => void;
}

export function TrainingSetupModal({
  open,
  mode,
  module,
  difficulty,
  kidsAssist,
  training,
  onModuleChange,
  onDifficultyChange,
  onKidsAssistChange,
  onStart,
  onClose,
}: TrainingSetupModalProps) {
  const entry = MODE_CATALOG[mode];

  return (
    <Sheet open={open} title={entry.name} onClose={onClose}>
      <p className="ui-body text-[15px] font-semibold text-arcade-text">{entry.description}</p>
      <p className="ui-body mt-2 text-[14px] text-arcade-muted">{TRAINING_DISCLAIMER}</p>

      {mode === "zen" ? (
        <>
          <div className="mt-6 grid gap-2">
            <p className="ui-body text-[15px] text-arcade-text/95">
              Green targets only. No traps, no timer, no game over — finish whenever you like.
            </p>
            <p className="ui-body text-[14px] text-arcade-muted">
              Up to {ZEN_CONFIG.xpDailyCap} XP per day for sessions of at least{" "}
              {ZEN_CONFIG.xpSessionSeconds}s and {ZEN_CONFIG.xpSessionTaps} taps.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={kidsAssist}
            onClick={() => onKidsAssistChange(!kidsAssist)}
            className={`mt-5 grid min-h-16 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border px-4 py-4 text-left ${
              kidsAssist
                ? "border-neon-green bg-arcade-surface"
                : "border-arcade-line bg-arcade-surface/70"
            }`}
          >
            <span className="min-w-0">
              <span className="ui-title block text-base text-arcade-text">
                {KIDS_ASSIST_CONFIG.label}
              </span>
              <span className="ui-body-tight mt-0.5 block text-[14px] text-arcade-muted">
                {KIDS_ASSIST_CONFIG.description}
              </span>
            </span>
            <span
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                kidsAssist ? "bg-neon-green" : "bg-arcade-line"
              }`}
            >
              <span
                className={`absolute top-1 size-5 rounded-full bg-arcade-text transition-all ${
                  kidsAssist ? "left-6" : "left-1"
                }`}
              />
            </span>
          </button>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Fact label="SESSIONS" value={String(training.zen.sessionsCompleted)} />
            <Fact label="BEST TAPS" value={String(training.zen.bestTapCount)} />
          </div>
        </>
      ) : (
        <>
          <fieldset className="mt-6">
            <legend className="sticker-sm text-[11px] tracking-[0.24em] text-arcade-text/80">
              MODULE
            </legend>
            <div className="mt-3 grid gap-2">
              {TRAINING_MODULES.map((id) => {
                const config = TRAINER_MODULES[id];
                const stats = training.trainer.modules[id];
                const selected = id === module;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onModuleChange(id)}
                    className={`rounded-2xl border px-4 py-3 text-left ${
                      selected
                        ? "border-neon-green bg-arcade-surface"
                        : "border-arcade-line bg-arcade-surface/70"
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="ui-title text-base text-arcade-text">{config.name}</span>
                      <span className="sticker-sm shrink-0 text-[10px] tracking-[0.18em] text-arcade-text/70 tabular-nums">
                        {stats.sessions > 0 ? `${Math.round(stats.bestAccuracy * 100)}%` : "NEW"}
                      </span>
                    </span>
                    <span className="ui-body-tight mt-1 block text-[14px] text-arcade-muted">
                      {config.rule}
                    </span>
                    <span className="ui-body-tight mt-1 block text-[13px] text-arcade-muted/85">
                      {config.sessionLength} targets · {config.objective}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="sticker-sm text-[11px] tracking-[0.24em] text-arcade-text/80">
              PACE
            </legend>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {TRAINING_DIFFICULTIES.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={id === difficulty}
                  onClick={() => onDifficultyChange(id)}
                  className={`rounded-2xl border px-2 py-3 text-center ${
                    id === difficulty
                      ? "border-neon-green bg-arcade-surface"
                      : "border-arcade-line bg-arcade-surface/70"
                  }`}
                >
                  <span className="sticker-sm block text-sm text-arcade-text">
                    {TRAINER_TIMING[id].name}
                  </span>
                  <span className="ui-body mt-1 block text-[12px] text-arcade-muted tabular-nums">
                    {TRAINER_TIMING[id].duration}ms
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <button
        type="button"
        onClick={onStart}
        className="arcade-btn sticker-sm mt-7 min-h-16 w-full bg-neon-green py-4 text-2xl text-arcade-bg-deep"
      >
        Start →
      </button>
    </Sheet>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-arcade-line bg-arcade-surface/70 px-3 py-3">
      <p className="sticker-sm text-[11px] tracking-[0.12em] text-arcade-muted">{label}</p>
      <p className="sticker-sm mt-1 text-lg text-arcade-text tabular-nums">{value}</p>
    </div>
  );
}
