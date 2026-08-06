import { TRAINER_MODULES, TRAINER_TIMING } from "@/game/trainingConfig";
import type {
  TrainerSessionResult,
  TrainingRewardResult,
  ZenSessionResult,
} from "@/game/trainingTypes";
import { formatMsValue, formatPlayTime } from "@/game/format";
import { emptyShareData, type ShareResultData } from "@/game/shareResult";
import { ArcadeBackdrop } from "./ArcadeBackdrop";
import { ShareButton } from "./ShareButton";
import { TrainingBadge } from "./ModeSelector";

interface TrainingSummaryScreenProps {
  zen: ZenSessionResult | null;
  trainer: TrainerSessionResult | null;
  reward: TrainingRewardResult | null;
  /** True when the session was practice: nothing was recorded. */
  practice?: boolean;
  onAgain: () => void;
  onChangeMode: () => void;
  onMenu: () => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-arcade-line bg-arcade-surface/70 px-2 py-3 text-center">
      <p className="sticker-sm text-[11px] tracking-[0.12em] text-arcade-muted">{label}</p>
      <p className="sticker-sm mt-1 text-lg text-arcade-text tabular-nums">{value}</p>
    </div>
  );
}

export function TrainingSummaryScreen({
  zen,
  trainer,
  reward,
  practice = false,
  onAgain,
  onChangeMode,
  onMenu,
}: TrainingSummaryScreenProps) {
  const share: ShareResultData = zen
    ? {
        ...emptyShareData("zen"),
        taps: zen.taps,
        longestStreak: zen.longestStreak,
        averageReaction: zen.avgReaction,
        sessionDuration: zen.durationMs,
        kidsAssistEnabled: zen.kidsAssist,
      }
    : trainer
      ? {
          ...emptyShareData("trainer"),
          accuracy: trainer.accuracy,
          averageReaction: trainer.avgReaction,
          sessionDuration: trainer.durationMs,
          trainerModule: trainer.module,
          trainerDifficulty: trainer.difficulty,
        }
      : emptyShareData("zen");

  return (
    <div className="no-select safe-area relative min-h-[100dvh] overflow-hidden">
      <ArcadeBackdrop />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col justify-center px-5 py-8">
        <p className="sticker-sm text-center text-[11px] tracking-[0.3em] text-arcade-text/80">
          {practice
            ? "PRACTICE MODE"
            : zen
              ? zen.kidsAssist
                ? "ZEN · KIDS ASSIST"
                : "ZEN MODE"
              : "REFLEX TRAINER"}
        </p>
        {practice && (
          <p className="ui-body mt-2 text-center text-[14px] text-arcade-muted">
            Practice run — no scores, XP or statistics were saved.
          </p>
        )}
        <h1 className="sticker-text mt-2 text-center text-[clamp(34px,11vw,56px)] leading-none text-neon-green glow-green">
          {zen ? "Session Complete" : "Practice Complete"}
        </h1>

        <div className="arcade-panel mt-5 p-5 text-center">
          {zen ? (
            <>
              <p className="sticker-sm text-[11px] tracking-[0.25em] text-arcade-text/80">TAPS</p>
              <p className="sticker-text text-7xl leading-none text-neon-green glow-green tabular-nums">
                {zen.taps}
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <Stat label="STREAK" value={String(zen.longestStreak)} />
                <Stat label="TIME" value={formatPlayTime(zen.durationMs)} />
                <Stat label="AVG" value={formatMsValue(zen.avgReaction)} />
              </div>
            </>
          ) : trainer ? (
            <>
              <p className="sticker-sm text-[11px] tracking-[0.25em] text-arcade-text/80">
                ACCURACY
              </p>
              <p className="sticker-text text-7xl leading-none text-neon-gold glow-gold tabular-nums">
                {Math.round(trainer.accuracy * 100)}%
              </p>
              <p className="sticker-sm mt-1 text-[11px] tracking-[0.18em] text-arcade-text/85">
                {TRAINER_MODULES[trainer.module].name.toUpperCase()} ·{" "}
                {TRAINER_TIMING[trainer.difficulty].name.toUpperCase()}
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <Stat label="CORRECT" value={`${trainer.correct}/${trainer.targetsPresented}`} />
                <Stat label="MISTAKES" value={String(trainer.mistakes)} />
                <Stat label="AVG" value={formatMsValue(trainer.avgReaction)} />
                <Stat label="FASTEST" value={formatMsValue(trainer.fastestReaction)} />
                <Stat label="BEST RUN" value={String(trainer.bestStreak)} />
                <Stat label="TIME" value={formatPlayTime(trainer.durationMs)} />
              </div>
              {trainer.module === "red" && (
                <p className="ui-body mt-4 text-[14px] text-arcade-muted">
                  Traps avoided {trainer.trapsAvoided} · traps tapped {trainer.trapTaps}
                </p>
              )}
              {trainer.module === "purple" && (
                <p className="ui-body mt-4 text-[14px] text-arcade-muted">
                  Doubles completed {trainer.purpleCompleted} · single taps {trainer.purpleOneTap}
                </p>
              )}
            </>
          ) : null}
        </div>

        {reward && reward.xpAwarded > 0 && (
          <div className="arcade-panel mt-4 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="sticker-sm text-[11px] tracking-[0.2em] text-arcade-text/80">
                XP EARNED
              </span>
              <span className="sticker-sm text-2xl text-neon-green glow-green tabular-nums">
                +{reward.xpAwarded}
              </span>
            </div>
            <ul className="mt-2 space-y-1">
              {reward.reasons.map((r) => (
                <li
                  key={r.label}
                  className="ui-body flex justify-between text-[14px] text-arcade-text/95"
                >
                  <span>{r.label}</span>
                  <span className="tabular-nums">+{r.xp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {reward && reward.newRecords.length > 0 && (
          <p className="sticker-sm mt-3 text-center text-xs tracking-[0.18em] text-neon-gold glow-gold">
            NEW TRAINING BEST · {reward.newRecords.join(" · ")}
          </p>
        )}

        <div className="mt-6 grid gap-3 pb-2">
          <button
            type="button"
            onClick={onAgain}
            className="arcade-btn sticker-sm min-h-16 w-full bg-neon-green py-5 text-2xl text-arcade-bg-deep"
          >
            Practice Again →
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onChangeMode}
              className="arcade-btn ui-title min-h-12 border border-arcade-line bg-arcade-surface py-4 text-base text-arcade-text"
            >
              Change Mode
            </button>
            <button
              type="button"
              onClick={onMenu}
              className="arcade-btn ui-title min-h-12 border border-arcade-line bg-arcade-surface py-4 text-base text-arcade-text"
            >
              Main Menu
            </button>
          </div>
          <ShareButton data={share} label="Share Session" />
          <TrainingBadge />
        </div>
      </div>
    </div>
  );
}
