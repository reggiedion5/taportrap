import type { ActiveTarget } from "@/game/types";
import { TARGET_LABEL } from "@/game/types";

const COLOR_STYLE: Record<ActiveTarget["color"], { ring: string; face: string; text: string }> = {
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
  reducedMotion: boolean;
  onTap: () => void;
}

export function Target({ target, disabled, reducedMotion, onTap }: TargetProps) {
  const style = COLOR_STYLE[target.color];
  // green/gold stay tappable briefly after resolving so an extra tap counts as a mistake
  const punishExtraTap = target.resolved && (target.color === "green" || target.color === "gold");
  const inactive = disabled || (target.resolved && !punishExtraTap);
  const halfTapped = target.color === "purple" && target.taps === 1;

  return (
    <button
      type="button"
      aria-label={`${target.color} target: ${TARGET_LABEL[target.color]}`}
      data-target-color={target.color}
      disabled={inactive}
      onPointerDown={(e) => {
        // pointer events fire once per touch/click — no synthetic double-fire
        if (e.button !== 0 && e.pointerType === "mouse") return;
        e.preventDefault();
        e.stopPropagation();
        if (!inactive) onTap();
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={`no-select absolute grid place-items-center rounded-full ${style.ring} ${
        reducedMotion ? "" : "animate-pop-in active:scale-90"
      } ${target.resolved ? "opacity-0 transition-opacity duration-150" : ""}`}
      style={{
        left: target.x,
        top: target.y,
        width: target.size,
        height: target.size,
        transform: "translate(-50%, -50%)",
        touchAction: "manipulation",
      }}
    >
      <span
        className={`grid size-full place-items-center overflow-hidden rounded-full ${style.face}`}
        style={reducedMotion ? undefined : { animation: "target-pulse 1.1s ease-in-out infinite" }}
      >
        {target.color === "gold" && !reducedMotion && (
          <span
            className="pointer-events-none absolute inset-y-0 w-1/3 bg-arcade-text/45 blur-[2px]"
            style={{ animation: "shimmer-sweep 1.1s linear infinite" }}
          />
        )}
        <span
          className={`relative font-black tracking-widest ${style.text} ${
            target.color === "purple"
              ? "text-[clamp(22px,6vw,32px)]"
              : target.color === "gold"
                ? "text-[clamp(12px,3.4vw,17px)]"
                : "text-[clamp(16px,4.4vw,22px)]"
          }`}
        >
          {TARGET_LABEL[target.color]}
        </span>
        {target.color === "purple" && (
          <span className="absolute bottom-3 text-[11px] font-bold tracking-[0.18em] text-arcade-text/85">
            {halfTapped ? "AGAIN!" : "2 TAPS"}
          </span>
        )}
      </span>
      {halfTapped && (
        <span className="pointer-events-none absolute inset-[-10px] rounded-full border-4 border-neon-purple/70" />
      )}
    </button>
  );
}
