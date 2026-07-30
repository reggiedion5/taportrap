import { RotateCcw } from "lucide-react";

/**
 * Shown only when a phone-sized device is held in landscape during a run.
 * The run is paused, never ended, and this disappears the moment portrait
 * returns — resuming still requires an explicit tap on the pause overlay.
 */
export function OrientationOverlay() {
  return (
    <div
      role="alertdialog"
      aria-label="Rotate your phone"
      className="no-select safe-screen fixed inset-0 z-[70] grid place-items-center bg-arcade-bg-deep/96 px-6 text-center backdrop-blur-sm"
    >
      <div className="max-w-xs">
        <RotateCcw className="mx-auto size-12 animate-wiggle text-neon-green" aria-hidden />
        <p className="sticker-text mt-5 text-2xl text-arcade-text glow-white">
          Rotate your phone to portrait to continue.
        </p>
        <p className="mt-3 text-sm font-bold text-arcade-text/75">
          Your run is paused and your timer is frozen.
        </p>
      </div>
    </div>
  );
}
