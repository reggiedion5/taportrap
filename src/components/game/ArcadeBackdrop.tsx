import { BoardEnvironment } from "./BoardEnvironment";
import { useActiveBoard } from "./BoardContext";

const SPARKS = [
  { left: "12%", delay: "0s", size: 3, color: "var(--logo-green)" },
  { left: "26%", delay: "-2.4s", size: 2, color: "var(--chrome-hi)" },
  { left: "41%", delay: "-4.1s", size: 2.5, color: "var(--logo-green)" },
  { left: "58%", delay: "-1.2s", size: 2, color: "var(--logo-red)" },
  { left: "71%", delay: "-3.3s", size: 3, color: "var(--chrome-hi)" },
  { left: "86%", delay: "-5.2s", size: 2.5, color: "var(--logo-red)" },
];

/**
 * Global chrome-arcade atmosphere: deep space gradient, hex grid, soft radial
 * lighting, drifting energy orbs, rising sparks and a faint lightning flicker.
 * Purely decorative and cheap — six DOM sparks, no canvas, no JS loop.
 */
export function ArcadeBackdrop() {
  const board = useActiveBoard();

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* equipped board environment — never pure black */}
      <BoardEnvironment
        boardId={board.boardId}
        effectsEnabled={board.effectsEnabled}
        reducedMotion={board.reducedMotion}
      />

      {/* soft radial stage lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,color-mix(in_oklab,var(--logo-green)_14%,transparent),transparent_52%),radial-gradient(circle_at_86%_88%,color-mix(in_oklab,var(--logo-red)_12%,transparent),transparent_54%),radial-gradient(circle_at_50%_42%,oklch(1_0_0_/_0.05),transparent_60%)]" />

      {/* hexagonal weave */}
      <div className="hex-field absolute inset-0 opacity-[0.06]" />

      {/* smoke / energy orbs */}
      <div className="animate-orb-drift absolute -top-28 -left-24 size-80 rounded-full bg-logo-green/12 blur-[90px]" />
      <div
        className="animate-orb-drift absolute -right-28 bottom-[-6rem] size-96 rounded-full bg-logo-red/12 blur-[100px]"
        style={{ animationDelay: "-6s" }}
      />

      {/* faint lightning */}
      <div className="animate-lightning absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--logo-red)_22%,transparent),transparent_70%)]" />

      {/* rising sparks */}
      {SPARKS.map((s) => (
        <span
          key={s.left}
          className="animate-spark absolute bottom-0 rounded-full"
          style={{
            left: s.left,
            width: s.size,
            height: s.size,
            background: s.color,
            boxShadow: `0 0 8px ${s.color}`,
            animationDelay: s.delay,
          }}
        />
      ))}

      {/* chrome vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_45%,oklch(0_0_0_/_0.55)_100%)]" />
    </div>
  );
}
