interface CountdownOverlayProps {
  label: string;
  reducedMotion: boolean;
}

/** 3 · 2 · 1 · GO shown before a session begins. */
export function CountdownOverlay({ label, reducedMotion }: CountdownOverlayProps) {
  const isGo = label === "GO";
  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-arcade-bg-deep/80"
      role="status"
      aria-live="assertive"
    >
      <span
        key={label}
        className={`sticker-text text-[clamp(64px,26vw,140px)] leading-none ${
          isGo ? "text-neon-green glow-green" : "text-arcade-text glow-white"
        } ${reducedMotion ? "" : "animate-slam"}`}
      >
        {label}
      </span>
    </div>
  );
}
