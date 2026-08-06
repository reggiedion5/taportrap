import { useState } from "react";

/** Local bundled logo path — works offline and under capacitor://localhost. */
export const LOGO_SRC = "/tap-or-trap-logo.png";

interface BrandLogoProps {
  className?: string;
  /** Rendered box size in px (square, layout-stable while loading). */
  size?: number;
  alt?: string;
  fallbackClassName?: string;
}

/**
 * Renders the official logo from the bundled asset. If the image ever fails to
 * load, a styled text lockup replaces it instead of the broken-image icon.
 */
export function BrandLogo({
  className = "",
  size = 320,
  alt = "Tap or Trap! — tap fast, think faster",
  fallbackClassName = "",
}: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        style={{ width: size, height: size }}
        className={`grid place-content-center place-items-center text-center ${fallbackClassName} ${className}`}
      >
        <span className="sticker-text text-3xl leading-tight">
          <span className="text-logo-green">TAP</span> <span className="text-arcade-text">OR</span>{" "}
          <span className="text-neon-red">TRAP!</span>
        </span>
        <span className="ui-title mt-2 block text-[12px] tracking-[0.2em] text-arcade-muted">
          TAP FAST. THINK FASTER.
        </span>
      </div>
    );
  }

  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      width={size}
      height={size}
      decoding="async"
      onError={() => setFailed(true)}
      style={{ width: size, height: size, objectFit: "contain" }}
      className={className}
    />
  );
}
