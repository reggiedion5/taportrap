import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import type { Achievement } from "@/game/progressionTypes";
import { TIER_LABEL } from "@/game/achievements";

interface AchievementToastQueueProps {
  queue: Achievement[];
  onDismiss: (id: string) => void;
  reducedMotion: boolean;
}

const TIER_STYLE: Record<Achievement["tier"], string> = {
  bronze: "border-neon-gold/50 text-neon-gold",
  silver: "border-arcade-text/60 text-arcade-text",
  gold: "border-neon-gold text-neon-gold",
  platinum: "border-neon-purple text-neon-purple",
};

/** Shows one achievement at a time so notifications never overlap. */
export function AchievementToastQueue({
  queue,
  onDismiss,
  reducedMotion,
}: AchievementToastQueueProps) {
  const current = queue[0];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!current) return;
    setVisible(true);
    const id = window.setTimeout(() => {
      setVisible(false);
      onDismiss(current.id);
    }, 2600);
    return () => window.clearTimeout(id);
  }, [current, onDismiss]);

  if (!current) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))]"
      aria-live="polite"
    >
      <div
        className={`arcade-panel pointer-events-auto flex w-full max-w-sm items-center gap-3 border-2 px-4 py-3 ${TIER_STYLE[current.tier]} ${
          !reducedMotion && visible ? "animate-pop-word" : ""
        }`}
      >
        <Trophy className="size-6 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="sticker-sm text-[11px] tracking-[0.18em]">
            {TIER_LABEL[current.tier].toUpperCase()} UNLOCKED
          </p>
          <p className="truncate text-base font-black text-arcade-text">{current.title}</p>
          <p className="ui-body-tight truncate text-[13px] text-arcade-text/95">
            +{current.rewardXp} XP
          </p>
        </div>
      </div>
    </div>
  );
}
