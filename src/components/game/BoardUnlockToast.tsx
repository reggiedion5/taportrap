import { useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { boardById } from "@/game/boards";

interface BoardUnlockToastProps {
  /** FIFO queue of newly unlocked board ids; only the first is shown. */
  queue: string[];
  reducedMotion: boolean;
  onDismiss: (id: string) => void;
  onEquip: (id: string) => void;
}

const DURATION_MS = 6000;

/** Non-blocking notice that a new board joined the collection. */
export function BoardUnlockToast({
  queue,
  reducedMotion,
  onDismiss,
  onEquip,
}: BoardUnlockToastProps) {
  const currentId = queue[0] ?? null;

  useEffect(() => {
    if (!currentId) return;
    const timer = window.setTimeout(() => onDismiss(currentId), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [currentId, onDismiss]);

  if (!currentId) return null;
  const board = boardById(currentId);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))]"
      aria-live="polite"
    >
      <div
        role="status"
        className={`chrome-card pointer-events-auto w-full max-w-sm border-2 border-logo-green/60 ${
          reducedMotion ? "animate-toast-fade" : "animate-pop-word"
        }`}
      >
        <div className="chrome-face flex items-start gap-3 px-4 py-3">
          <span
            className="mt-0.5 size-9 shrink-0 rounded-lg border border-arcade-line"
            style={{ background: board.base }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="sticker-sm text-[11px] tracking-[0.18em]">
              <Sparkles className="mr-1 inline size-3.5" aria-hidden /> BOARD UNLOCKED
            </p>
            <p className="truncate text-base font-black text-arcade-text">{board.name}</p>
            <p className="ui-body-tight line-clamp-2 text-[13px] text-arcade-text/95">
              {board.description}
            </p>
            <button
              type="button"
              onClick={() => {
                onEquip(board.id);
                onDismiss(board.id);
              }}
              className="ui-title mt-2 rounded-lg border border-neon-green/60 px-2.5 py-1.5 text-[11px] tracking-[0.12em] text-neon-green"
            >
              EQUIP NOW
            </button>
          </div>
          <button
            type="button"
            aria-label="Dismiss board notification"
            onClick={() => onDismiss(board.id)}
            className="-mr-1 -mt-1 shrink-0 rounded-lg p-2 text-arcade-muted"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
