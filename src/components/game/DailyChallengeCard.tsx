import { CalendarCheck, Flame } from "lucide-react";
import type { DailyChallenge, DailyState } from "@/game/progressionTypes";
import { DAILY_XP_REWARD } from "@/game/daily";

interface DailyChallengeCardProps {
  challenge: DailyChallenge;
  daily: DailyState;
  reducedMotion: boolean;
}

export function DailyChallengeCard({
  challenge,
  daily,
  reducedMotion,
}: DailyChallengeCardProps) {
  const target = challenge.target;
  const value = daily.progress;
  const pct = challenge.lowerIsBetter
    ? value > 0
      ? Math.min(100, (target / value) * 100)
      : 0
    : Math.min(100, (value / target) * 100);

  const progressLabel = challenge.lowerIsBetter
    ? value > 0
      ? `${Math.round(value)}ms best · target ${target}ms`
      : `No qualifying run yet · target ${target}ms`
    : `${Math.round(value)} / ${target}`;

  return (
    <section
      className={`arcade-panel p-5 ${
        daily.completed
          ? `border-2 border-neon-gold ${reducedMotion ? "" : "shadow-[0_0_36px_-10px_var(--neon-gold)]"}`
          : ""
      }`}
      aria-label="Daily challenge"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="sticker-sm flex items-center gap-2 text-[10px] tracking-[0.24em] text-neon-gold glow-gold">
          <CalendarCheck className="size-4" aria-hidden /> DAILY CHALLENGE
        </span>
        <span className="sticker-sm flex items-center gap-1 text-[10px] tracking-[0.18em] text-arcade-text">
          <Flame className="size-4 text-neon-red" aria-hidden />
          {daily.currentStreak} DAY
        </span>
      </div>

      <p className="mt-3 text-base font-black text-arcade-text">
        {challenge.objective}
      </p>

      {daily.completed ? (
        <p className="sticker-sm mt-3 text-sm tracking-[0.12em] text-neon-green glow-green">
          COMPLETED · +{DAILY_XP_REWARD} XP · New challenge tomorrow
        </p>
      ) : (
        <>
          <div
            className="mt-3 h-3 overflow-hidden rounded-full bg-arcade-surface"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            aria-label="Daily challenge progress"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-neon-gold to-neon-green"
              style={{
                width: `${pct}%`,
                transition: reducedMotion ? "none" : "width 400ms ease-out",
              }}
            />
          </div>
          <p className="mt-2 text-xs font-bold text-arcade-text/85 tabular-nums">
            {progressLabel} · Reward {DAILY_XP_REWARD} XP
          </p>
        </>
      )}
    </section>
  );
}
