import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ArcTone = "green" | "steel" | "red";

const TONE_FACE: Record<ArcTone, string> = {
  green: "btn-green",
  steel: "btn-steel",
  red: "btn-red",
};

interface ArcButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ArcTone;
  icon?: ReactNode;
  /** taller hero-sized button */
  size?: "md" | "lg";
  /**
   * Square icon button whose children are a screen-reader-only label. Drops the
   * icon/label gap so the glyph sits dead-centre in the face.
   */
  iconOnly?: boolean;
  faceClassName?: string;
}

/**
 * The single button primitive for the whole app: chrome bezel, metallic face,
 * gloss highlight, neon glow, hover lift and a 96% press.
 */
export function ArcButton({
  tone = "steel",
  icon,
  size = "md",
  iconOnly = false,
  className,
  faceClassName,
  children,
  ...rest
}: ArcButtonProps) {
  return (
    <button type="button" {...rest} className={cn("btn-arc no-select w-full", className)}>
      <span
        className={cn(
          "btn-arc-face ui-title",
          TONE_FACE[tone],
          size === "lg" ? "min-h-16 px-5 text-2xl" : "min-h-12 px-4 text-base",
          iconOnly && "gap-0",
          faceClassName,
        )}
      >
        <span className="btn-gloss" aria-hidden />
        {icon && <span className="relative z-10 flex shrink-0 items-center">{icon}</span>}
        {iconOnly ? children : <span className="relative z-10 truncate">{children}</span>}
      </span>
    </button>
  );
}


/** Metal card: chrome bezel + inner-glow face. */
export function ChromeCard({
  className,
  faceClassName,
  children,
}: {
  className?: string;
  faceClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("chrome-card", className)}>
      <div className={cn("chrome-face", faceClassName)}>{children}</div>
    </div>
  );
}

/** Small chrome status badge used across the HUD. */
export function ChromeBadge({
  className,
  faceClassName,
  children,
}: {
  className?: string;
  faceClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("chrome-badge", className)}>
      <div className={cn("chrome-badge-face px-3 py-1.5", faceClassName)}>{children}</div>
    </div>
  );
}
