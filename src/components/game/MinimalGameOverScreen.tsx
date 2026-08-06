interface MinimalGameOverScreenProps {
  score: number;
  bestScore: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

/**
 * Static, effect-free game over screen used to isolate the native iOS blank
 * screen. No animations, timers, portals, blur, filters, or glow.
 */
export function MinimalGameOverScreen({
  score,
  bestScore,
  onPlayAgain,
  onHome,
}: MinimalGameOverScreenProps) {
  return (
    <section
      role="alert"
      className="safe-screen relative z-[100] flex min-h-[100dvh] flex-col items-center justify-center bg-arcade-bg-deep px-6"
    >
      <div className="w-full max-w-sm">
        <h1 className="ui-title text-center text-4xl text-neon-red">GAME OVER</h1>

        <p className="ui-body mt-8 text-center text-sm text-arcade-text">FINAL SCORE</p>
        <p className="ui-title text-center text-6xl text-neon-gold tabular-nums">{score}</p>

        <p className="ui-body mt-4 text-center text-sm text-arcade-text">BEST {bestScore}</p>

        <div className="mt-10 grid gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="ui-title min-h-14 w-full border-2 border-neon-green bg-neon-green px-5 py-4 text-lg text-arcade-bg-deep"
          >
            Play Again
          </button>
          <button
            type="button"
            onClick={onHome}
            className="ui-title min-h-14 w-full border-2 border-arcade-line bg-arcade-surface px-5 py-4 text-lg text-arcade-text"
          >
            Home
          </button>
        </div>
      </div>
    </section>
  );
}
