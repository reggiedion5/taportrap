import { useEffect, useRef, useState } from "react";

interface XpProgressBarProps {
  level: number;
  currentXp: number;
  xpForNext: number;
  animate?: boolean;
  reducedMotion?: boolean;
  compact?: boolean;
}

export function XpProgressBar({
  level,
  currentXp,
  xpForNext,
  animate = false,
  reducedMotion = false,
  compact = false,
}: XpProgressBarProps) {
  const pct = xpForNext > 0 ? Math.min(100, (currentXp / xpForNext) * 100) : 0;
  const [width, setWidth] = useState(animate && !reducedMotion ? 0 : pct);
  const mounted = useRef(false);

  useEffect(() => {
    if (!animate || reducedMotion) {
      setWidth(pct);
      return;
    }
    if (!mounted.current) {
      mounted.current = true;
      const id = window.setTimeout(() => setWidth(pct), 60);
      return () => window.clearTimeout(id);
    }
    setWidth(pct);
  }, [animate, pct, reducedMotion]);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="sticker-sm text-[11px] tracking-[0.2em] text-arcade-text">
          LEVEL {level}
        </span>
        <span className="sticker-sm text-[11px] tracking-[0.14em] text-arcade-text/80 tabular-nums">
          {Math.round(currentXp)} / {xpForNext} XP
        </span>
      </div>
      <div
        className={`mt-2 overflow-hidden rounded-full bg-arcade-surface ${compact ? "h-2" : "h-3"}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={xpForNext}
        aria-valuenow={Math.round(currentXp)}
        aria-label={`Level ${level} progress`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-neon-green to-neon-gold"
          style={{
            width: `${width}%`,
            transition: reducedMotion ? "none" : "width 900ms cubic-bezier(.2,.8,.2,1)",
          }}
        />
      </div>
    </div>
  );
}
