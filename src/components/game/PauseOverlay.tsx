interface PauseOverlayProps {
  onResume: () => void;
  onQuit: () => void;
}

export function PauseOverlay({ onResume, onQuit }: PauseOverlayProps) {
  return (
    <div className="no-select absolute inset-0 z-30 grid place-items-center bg-arcade-bg-deep/85 backdrop-blur-sm">
      <div className="arcade-panel w-[min(88vw,360px)] p-7 text-center">
        <h2 className="sticker-text text-4xl text-arcade-text glow-white">PAUSED</h2>
        <p className="mt-3 text-sm font-bold text-arcade-text/80">
          Timer's frozen. Catch your breath.
        </p>
        <div className="mt-7 grid gap-3">
          <button
            type="button"
            onClick={onResume}
            className="arcade-btn sticker-sm bg-neon-green py-4 text-lg text-arcade-bg-deep"
          >
            Back In →
          </button>
          <button
            type="button"
            onClick={onQuit}
            className="arcade-btn sticker-sm border border-arcade-line bg-arcade-surface py-4 text-base text-arcade-text"
          >
            Quit Game
          </button>
        </div>
      </div>
    </div>
  );
}
