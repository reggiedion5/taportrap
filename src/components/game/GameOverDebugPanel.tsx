interface GameOverDebugPanelProps {
  phase: string;
  score: number;
  bestScore: number;
  lives: number | null;
  currentRound: number;
  summaryExists: boolean;
  shake: boolean;
  flash: boolean;
  lifeLost: boolean;
  onPlayAgain: () => void;
  onHome: () => void;
}

/** Plain, timer-free loss screen for the temporary native diagnostic build. */
export function GameOverDebugPanel(props: GameOverDebugPanelProps) {
  console.info("[loss-debug] GameOverDebugPanel render", {
    phase: props.phase,
    score: props.score,
    bestScore: props.bestScore,
    lives: props.lives,
    currentRound: props.currentRound,
    summaryExists: props.summaryExists,
    animationFlags: { shake: props.shake, flash: props.flash, lifeLost: props.lifeLost },
  });

  return (
    <section
      role="alert"
      data-loss-debug="game-over"
      className="safe-screen relative z-[100] grid place-items-center bg-neon-red px-6 text-arcade-bg-deep"
    >
      <div className="w-full max-w-sm border-4 border-arcade-bg-deep bg-neon-red p-6">
        <h1 className="ui-title text-3xl font-black">GAME OVER DEBUG</h1>
        <dl className="ui-body mt-6 grid gap-2 text-base font-bold">
          <div className="flex justify-between gap-4"><dt>Final score</dt><dd>{props.score}</dd></div>
          <div className="flex justify-between gap-4"><dt>Best score</dt><dd>{props.bestScore}</dd></div>
          <div className="flex justify-between gap-4"><dt>Current phase</dt><dd>{props.phase}</dd></div>
          <div className="flex justify-between gap-4"><dt>Summary exists</dt><dd>{props.summaryExists ? "YES" : "NO"}</dd></div>
          <div className="flex justify-between gap-4"><dt>Lives</dt><dd>{props.lives ?? "N/A"}</dd></div>
          <div className="flex justify-between gap-4"><dt>Current round</dt><dd>{props.currentRound}</dd></div>
          <div className="flex justify-between gap-4"><dt>Animation flags</dt><dd>{props.shake || props.flash || props.lifeLost ? "ON" : "OFF"}</dd></div>
        </dl>
        <div className="mt-8 grid gap-3">
          <button type="button" onClick={props.onPlayAgain} className="min-h-14 border-4 border-arcade-bg-deep bg-arcade-bg-deep px-5 py-3 ui-title text-lg text-neon-red">
            Play Again
          </button>
          <button type="button" onClick={props.onHome} className="min-h-14 border-4 border-arcade-bg-deep bg-neon-red px-5 py-3 ui-title text-lg text-arcade-bg-deep">
            Home
          </button>
        </div>
      </div>
    </section>
  );
}