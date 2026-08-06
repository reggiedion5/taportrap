import { boardById } from "@/game/boards";

interface BoardEnvironmentProps {
  boardId: string;
  /** Ambient particle/animation layer. Off keeps only the static art. */
  effectsEnabled: boolean;
  reducedMotion: boolean;
}

/**
 * Renders the equipped board's environment behind the arcade chrome.
 *
 * Static base art + one CSS ambient layer + a fixed readability scrim. No
 * canvas, no JS loop and no per-frame work, so gameplay timing is untouched
 * and iOS WebViews stay stable.
 */
export function BoardEnvironment({
  boardId,
  effectsEnabled,
  reducedMotion,
}: BoardEnvironmentProps) {
  const board = boardById(boardId);
  const showAmbient = effectsEnabled && board.effect !== "none";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: board.base }} />
      {showAmbient && (
        <div
          className={`board-fx board-fx-${board.effect} ${reducedMotion ? "board-fx-still" : ""}`}
        />
      )}
      {/* readability scrim — keeps target colours unmistakable on every board */}
      <div className="board-readability absolute inset-0" />
    </div>
  );
}
