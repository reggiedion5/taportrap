import type { ActiveTarget } from "@/game/types";
import { TARGET_LABEL } from "@/game/types";

const COLOR_STYLE: Record<
  ActiveTarget["color"],
  { ring: string; face: string; text: string }
> = {
  green: {
    ring: "text-neon-green",
    face: "bg-neon-green",
    text: "text-arcade-bg-deep",
  },
  red: { ring: "text-neon-red", face: "bg-neon-red", text: "text-arcade-text" },
  gold: {
    ring: "text-neon-gold",
    face: "bg-neon-gold",
    text: "text-arcade-bg-deep",
  },
  purple: {
    ring: "text-neon-purple",
    face: "bg-neon-purple",
    text: "text-arcade-text",
  },
};

interface TargetProps {
  target: ActiveTarget;
  disabled: boolean;
  onTap: () => void;
}

export function Target({ target, disabled, onTap }: TargetProps) {
  const style = COLOR_STYLE[target.color];

  return (
    <button
      type="button"
      aria-label={`${target.color} target: ${TARGET_LABEL[target.color]}`}
      disabled={disabled}
      onPointerDown={(e) => {
        e.preventDefault();
        if (!disabled) onTap();
      }}
      className={`no-select absolute grid size-[clamp(78px,22vw,132px)] place-items-center rounded-full ${style.ring} animate-pop-in active:scale-90`}
      style={{
        left: `${target.x}%`,
        top: `${target.y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <span
        className={`grid size-full place-items-center overflow-hidden rounded-full ${style.face}`}
        style={{ animation: "target-pulse 1.1s ease-in-out infinite" }}
      >
        {target.color === "gold" && (
          <span
            className="pointer-events-none absolute inset-y-0 w-1/3 bg-arcade-text/45 blur-[2px]"
            style={{ animation: "shimmer-sweep 1.1s linear infinite" }}
          />
        )}
        <span
          className={`relative text-[clamp(13px,3.6vw,18px)] font-black tracking-widest ${style.text}`}
        >
          {TARGET_LABEL[target.color]}
        </span>
        {target.color === "purple" && (
          <span className="absolute bottom-3 text-[10px] font-bold tracking-[0.18em] text-arcade-text/85">
            {target.taps === 1 ? "AGAIN!" : "2 TAPS"}
          </span>
        )}
      </span>
      {target.color === "purple" && target.taps === 1 && (
        <span className="pointer-events-none absolute inset-[-10px] rounded-full border-4 border-neon-purple/70" />
      )}
    </button>
  );
}
