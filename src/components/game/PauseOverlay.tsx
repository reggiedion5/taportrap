import type { MouseEvent, PointerEvent } from "react";

interface PauseOverlayProps {
  /** "system" when a call, notification or app switch interrupted the run. */
  source?: "manual" | "system";
  onResume: () => void;
  onQuit: () => void;
}

export function PauseOverlay({ source = "manual", onResume, onQuit }: PauseOverlayProps) {
  const interrupted = source === "system";

  const runPointerAction = (event: PointerEvent<HTMLButtonElement>, action: () => void) => {
    event.preventDefault();
    event.stopPropagation();
    action();
  };

  const runKeyboardAction = (event: MouseEvent<HTMLButtonElement>, action: () => void) => {
    // Pointer input is handled on pointer-down for reliable Capacitor/iOS taps.
    // Keep click support for keyboard and accessibility activation only.
    if (event.detail !== 0) return;
    event.stopPropagation();
    action();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={interrupted ? "Game interrupted" : "Game paused"}
      className="no-select safe-screen fixed inset-0 z-[80] grid place-items-center bg-arcade-bg-deep/92 px-5 backdrop-blur-sm"
      style={{ pointerEvents: "auto", touchAction: "manipulation" }}
    >
      <div className="arcade-panel w-[min(88vw,360px)] p-7 text-center">
        <h2 className="sticker-text text-4xl text-arcade-text glow-white">PAUSED</h2>
        <p className="ui-body mt-3 text-[15px] text-arcade-text/95">
          {interrupted
            ? "Something interrupted your run. Nothing was lost — your timer is frozen."
            : "Timer's frozen. Catch your breath."}
        </p>
        <div className="mt-7 grid gap-3">
          <button
            type="button"
            onPointerDown={(event) => runPointerAction(event, onResume)}
            onClick={(event) => runKeyboardAction(event, onResume)}
            style={{ touchAction: "manipulation", pointerEvents: "auto" }}
            className="arcade-btn sticker-sm min-h-14 bg-neon-green py-4 text-lg text-arcade-bg-deep"
          >
            Back In →
          </button>
          <button
            type="button"
            onPointerDown={(event) => runPointerAction(event, onQuit)}
            onClick={(event) => runKeyboardAction(event, onQuit)}
            style={{ touchAction: "manipulation", pointerEvents: "auto" }}
            className="arcade-btn ui-title min-h-14 border border-arcade-line bg-arcade-surface py-4 text-base text-arcade-text"
          >
            Quit Game
          </button>
        </div>
      </div>
    </div>
  );
}
