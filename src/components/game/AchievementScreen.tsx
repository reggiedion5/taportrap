import { useEffect, useRef } from "react";
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
  focused?: boolean;
  claimed?: boolean;
  onClaim?: (id: string) => void;
}

export function AchievementCard({
  achievement,
  progress,
  focused = false,
  claimed = true,
  onClaim,
}: AchievementCardProps) {
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!focused) return;
    const id = window.setTimeout(
      () => ref.current?.scrollIntoView({ block: "center", behavior: "smooth" }),
      120,
    );
    return () => window.clearTimeout(id);
  }, [focused]);

  const pct = Math.min(100, (progress.value / achievement.target) * 100);
  const showBar = !progress.unlocked && achievement.target > 1;
  return (
    <li
      ref={ref}
      className={`arcade-panel p-4 ${TIER_BORDER[achievement.tier]} ${
        progress.unlocked ? "" : "opacity-95"
      } ${focused ? "ring-2 ring-neon-green" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="sticker-sm text-base tracking-tight text-arcade-text">
            {achievement.title}
          </p>
          <p className="ui-body-tight mt-1.5 text-[15px] text-arcade-muted">
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
        <span className="sticker-sm text-[11px] tracking-[0.14em] text-arcade-muted">
          {TIER_LABEL[achievement.tier].toUpperCase()} · +{achievement.rewardXp} XP
        </span>
        {showBar && (
          <span className="sticker-sm text-[12px] text-arcade-muted tabular-nums">
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
      {progress.unlocked && !claimed && onClaim && (
        <button
          type="button"
          onClick={() => onClaim(achievement.id)}
          className="btn-arc mt-3 w-full rounded-xl"
        >
          <span className="btn-arc-face btn-green ui-title min-h-11 justify-center px-3 text-[13px]">
            <span className="btn-gloss" aria-hidden />
            <span className="relative z-10">Claim {achievement.rewardXp} XP</span>
          </span>
        </button>
      )}
    </li>
  );
}

interface AchievementScreenProps {
  open: boolean;
  progress: AchievementProgress[];
  focusId?: string | null;
  claimedIds?: Record<string, number>;
  onClaim?: (id: string) => void;
  onClaimAll?: () => void;
  onClose: () => void;
}

export function AchievementScreen({
  open,
  progress,
  focusId = null,
  claimedIds,
  onClaim,
  onClaimAll,
  onClose,
}: AchievementScreenProps) {
  const byId = new Map(progress.map((p) => [p.id, p]));
  const unlockedCount = progress.filter((p) => p.unlocked).length;
  const claimable = claimedIds
    ? progress.filter((p) => p.unlocked && claimedIds[p.id] === undefined).length
    : 0;

  return (
    <Sheet open={open} title="Achievements" onClose={onClose}>
      <p className="sticker-sm text-sm tracking-[0.16em] text-neon-gold glow-gold">
        {unlockedCount} / {ACHIEVEMENTS.length} UNLOCKED
      </p>

      {claimable > 0 && onClaimAll && (
        <button type="button" onClick={onClaimAll} className="btn-arc mt-3 w-full rounded-xl">
          <span className="btn-arc-face btn-green ui-title min-h-12 justify-center px-3 text-[14px]">
            <span className="btn-gloss" aria-hidden />
            <span className="relative z-10">
              Claim all {claimable} reward{claimable > 1 ? "s" : ""}
            </span>
          </span>
        </button>
      )}

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
                return (
                  <AchievementCard
                    key={a.id}
                    achievement={a}
                    progress={p}
                    focused={open && a.id === focusId}
                    claimed={claimedIds ? claimedIds[a.id] !== undefined : true}
                    onClaim={onClaim}
                  />
                );
              })}
            </ul>
          </section>
        );
      })}
    </Sheet>
  );
}
