interface PauseOverlayProps {
  onResume: () => void;
  onQuit: () => void;
}

export function PauseOverlay({ onResume, onQuit }: PauseOverlayProps) {
  return (
    <div className="no-select absolute inset-0 z-30 grid place-items-center bg-arcade-bg-deep/85 backdrop-blur-sm">
      <div className="arcade-panel w-[min(88vw,360px)] p-7 text-center">
        <h2 className="text-3xl font-black tracking-tight text-arcade-text">
          Paused
        </h2>
        <p className="mt-2 text-sm font-medium text-arcade-muted">
          The timer is frozen. Take a breath.
        </p>
        <div className="mt-7 grid gap-3">
          <button
            type="button"
            onClick={onResume}
            className="arcade-btn bg-neon-green py-4 text-base text-arcade-bg-deep"
          >
            Resume
          </button>
          <button
            type="button"
            onClick={onQuit}
            className="arcade-btn border border-arcade-line bg-arcade-surface py-4 text-base text-arcade-text"
          >
            Quit Game
          </button>
        </div>
      </div>
    </div>
  );
}
