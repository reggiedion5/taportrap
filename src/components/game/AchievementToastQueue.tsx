import { useCallback, useEffect, useRef, useState } from "react";
import { Trophy, X } from "lucide-react";
import type { Achievement } from "@/game/progressionTypes";
import { TIER_LABEL } from "@/game/achievements";

interface AchievementToastQueueProps {
  queue: Achievement[];
  onDismiss: (id: string) => void;
  /** Opens the Achievements screen, optionally focused on one achievement. */
  onView: (id?: string) => void;
  reducedMotion: boolean;
}

const TIER_STYLE: Record<Achievement["tier"], string> = {
  bronze: "border-neon-gold/50 text-neon-gold",
  silver: "border-arcade-text/60 text-arcade-text",
  gold: "border-neon-gold text-neon-gold",
  platinum: "border-neon-purple text-neon-purple",
};

const DURATION_MS = 5000;

/** Shows one achievement at a time so notifications never overlap or block the UI. */
export function AchievementToastQueue({
  queue,
  onDismiss,
  onView,
  reducedMotion,
}: AchievementToastQueueProps) {
  const current = queue[0];
  const currentId = current?.id ?? null;
  const remaining = queue.length;

  const [held, setHeld] = useState(false);
  const [dragX, setDragX] = useState(0);
  const startX = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (currentId) onDismiss(currentId);
  }, [currentId, onDismiss]);

  // one timeout per notification; paused while pressed/hovered
  useEffect(() => {
    if (!currentId || held) return;
    const timer = window.setTimeout(() => onDismiss(currentId), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [currentId, held, onDismiss]);

  // reset transient interaction state between notifications
  useEffect(() => {
    setHeld(false);
    setDragX(0);
    startX.current = null;
  }, [currentId]);

  if (!current) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))]"
      aria-live="polite"
    >
      <div
        role="status"
        className={`chrome-card pointer-events-auto w-full max-w-sm touch-pan-y border-2 ${
          TIER_STYLE[current.tier]
        } ${reducedMotion ? "animate-toast-fade" : "animate-pop-word"}`}
        style={{
          transform: dragX ? `translateX(${dragX}px)` : undefined,
          opacity: dragX ? Math.max(0, 1 - Math.abs(dragX) / 220) : undefined,
        }}
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
        onPointerDown={(e) => {
          startX.current = e.clientX;
          setHeld(true);
        }}
        onPointerMove={(e) => {
          if (startX.current === null) return;
          setDragX(e.clientX - startX.current);
        }}
        onPointerUp={() => {
          const dx = dragX;
          startX.current = null;
          setHeld(false);
          if (Math.abs(dx) > 90) dismiss();
          else setDragX(0);
        }}
        onPointerCancel={() => {
          startX.current = null;
          setHeld(false);
          setDragX(0);
        }}
      >
        <div className="chrome-face flex items-start gap-3 px-4 py-3">
          <Trophy className="mt-0.5 size-6 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="sticker-sm text-[11px] tracking-[0.18em]">
              ACHIEVEMENT UNLOCKED · {TIER_LABEL[current.tier].toUpperCase()}
            </p>
            <p className="truncate text-base font-black text-arcade-text">{current.title}</p>
            <p className="ui-body-tight line-clamp-2 text-[13px] text-arcade-text/95">
              {current.description}
            </p>
            <p className="ui-body-tight mt-0.5 text-[12px] text-arcade-muted">
              +{current.rewardXp} XP · View it in Achievements
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  dismiss();
                  onView(current.id);
                }}
                className="ui-title rounded-lg border border-neon-green/60 px-2.5 py-1.5 text-[11px] tracking-[0.12em] text-neon-green"
              >
                VIEW ACHIEVEMENT
              </button>
              {remaining > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    dismiss();
                    onView();
                  }}
                  className="ui-title rounded-lg border border-arcade-text/40 px-2.5 py-1.5 text-[11px] tracking-[0.12em] text-arcade-muted"
                >
                  VIEW ALL ({remaining})
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={dismiss}
            className="-mr-1 -mt-1 shrink-0 rounded-lg p-2 text-arcade-muted"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
