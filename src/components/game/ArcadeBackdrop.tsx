export function ArcadeBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden bg-arcade-bg-deep"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,color-mix(in_oklab,var(--neon-purple)_22%,transparent),transparent_55%),radial-gradient(circle_at_85%_80%,color-mix(in_oklab,var(--neon-green)_16%,transparent),transparent_55%)]" />
      <div className="animate-orb-drift absolute -top-24 -left-20 size-72 rounded-full bg-neon-purple/20 blur-3xl" />
      <div
        className="animate-orb-drift absolute -right-24 bottom-0 size-80 rounded-full bg-neon-green/15 blur-3xl"
        style={{ animationDelay: "-6s" }}
      />
      <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--arcade-line)_1px,transparent_1px),linear-gradient(90deg,var(--arcade-line)_1px,transparent_1px)] [background-size:48px_48px]" />
    </div>
  );
}
