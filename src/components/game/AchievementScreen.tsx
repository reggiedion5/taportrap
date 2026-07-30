import { Lock, Trophy } from "lucide-react";
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, TIER_LABEL } from "@/game/achievements";
import type { Achievement, AchievementProgress } from "@/game/progressionTypes";
import { Sheet } from "./Sheet";

const TIER_BORDER: Record<Achievement["tier"], string> = {
  bronze: "border-l-4 border-l-[oklch(0.68_0.12_60)]",
  silver: "border-l-4 border-l-arcade-text/70",
  gold: "border-l-4 border-l-neon-gold",
  platinum: "border-l-4 border-l-neon-purple",
};

interface AchievementCardProps {
  achievement: Achievement;
  progress: AchievementProgress;
}

export function AchievementCard({ achievement, progress }: AchievementCardProps) {
  const pct = Math.min(100, (progress.value / achievement.target) * 100);
  const showBar = !progress.unlocked && achievement.target > 1;
  return (
    <li
      className={`arcade-panel p-4 ${TIER_BORDER[achievement.tier]} ${
        progress.unlocked ? "" : "opacity-95"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="sticker-sm text-base tracking-tight text-arcade-text">
            {achievement.title}
          </p>
          <p className="mt-1 text-sm font-semibold text-arcade-text/85">
            {achievement.description}
          </p>
        </div>
        <span className="sticker-sm flex shrink-0 items-center gap-1 text-[10px] tracking-[0.16em] text-arcade-text">
          {progress.unlocked ? (
            <>
              <Trophy className="size-4 text-neon-gold" aria-hidden /> UNLOCKED
            </>
          ) : (
            <>
              <Lock className="size-4" aria-hidden /> LOCKED
            </>
          )}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="sticker-sm text-[10px] tracking-[0.18em] text-arcade-text/80">
          {TIER_LABEL[achievement.tier].toUpperCase()} · +{achievement.rewardXp} XP
        </span>
        {showBar && (
          <span className="sticker-sm text-[10px] text-arcade-text/80 tabular-nums">
            {progress.value} / {achievement.target}
          </span>
        )}
      </div>
      {showBar && (
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-arcade-surface"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={achievement.target}
          aria-valuenow={progress.value}
          aria-label={`${achievement.title} progress`}
        >
          <div className="h-full rounded-full bg-neon-green" style={{ width: `${pct}%` }} />
        </div>
      )}
    </li>
  );
}

interface AchievementScreenProps {
  open: boolean;
  progress: AchievementProgress[];
  onClose: () => void;
}

export function AchievementScreen({ open, progress, onClose }: AchievementScreenProps) {
  const byId = new Map(progress.map((p) => [p.id, p]));
  const unlockedCount = progress.filter((p) => p.unlocked).length;

  return (
    <Sheet open={open} title="Achievements" onClose={onClose}>
      <p className="sticker-sm text-sm tracking-[0.16em] text-neon-gold glow-gold">
        {unlockedCount} / {ACHIEVEMENTS.length} UNLOCKED
      </p>

      {ACHIEVEMENT_CATEGORIES.map((category) => {
        const items = ACHIEVEMENTS.filter((a) => a.category === category.id);
        return (
          <section key={category.id} className="mt-6">
            <h3 className="sticker-sm text-[11px] tracking-[0.26em] text-arcade-text/80">
              {category.label.toUpperCase()}
            </h3>
            <ul className="mt-3 grid gap-3">
              {items.map((a) => {
                const p = byId.get(a.id);
                if (!p) return null;
                return <AchievementCard key={a.id} achievement={a} progress={p} />;
              })}
            </ul>
          </section>
        );
      })}
    </Sheet>
  );
}
