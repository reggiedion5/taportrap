import { useMemo, useState } from "react";
import { Check, Lock } from "lucide-react";
import {
  BOARDS,
  BOARD_CATEGORY_LABEL,
  boardById,
  boardUnlockProgress,
  isBoardUnlocked,
  type BoardCategory,
  type BoardDefinition,
  type BoardUnlockContext,
} from "@/game/boards";
import { Sheet } from "./Sheet";
import { ArcButton } from "./ArcUI";
import { BoardEnvironment } from "./BoardEnvironment";

type Filter = "all" | "unlocked" | "locked";

interface BoardCollectionScreenProps {
  open: boolean;
  selectedBoardId: string;
  context: BoardUnlockContext;
  effectsEnabled: boolean;
  reducedMotion: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function BoardTile({
  board,
  unlocked,
  selected,
  context,
  onPreview,
}: {
  board: BoardDefinition;
  unlocked: boolean;
  selected: boolean;
  context: BoardUnlockContext;
  onPreview: (id: string) => void;
}) {
  const progress = boardUnlockProgress(board, context);
  return (
    <li>
      <button
        type="button"
        onClick={() => onPreview(board.id)}
        aria-pressed={selected}
        className={`chrome-card btn-arc w-full text-left ${
          selected ? "ring-2 ring-logo-green" : ""
        }`}
      >
        <span className="chrome-face block p-3">
          <span
            className="relative block h-20 w-full overflow-hidden rounded-xl border border-arcade-line"
            style={{ background: board.base }}
            aria-hidden
          >
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_45%,oklch(0_0_0_/_0.5)_100%)]" />
            <span className="absolute inset-x-2 bottom-2 flex gap-1.5">
              {board.swatch.map((c) => (
                <span
                  key={c}
                  className="size-3.5 rounded-full border border-arcade-line"
                  style={{ background: c }}
                />
              ))}
            </span>
            {!unlocked && (
              <span className="absolute inset-0 grid place-items-center bg-arcade-bg-deep/70">
                <Lock className="size-5 text-arcade-text/85" aria-hidden />
              </span>
            )}
          </span>

          <span className="ui-title mt-2.5 flex items-center justify-between gap-2 text-[15px]">
            <span className="truncate">{board.name}</span>
            {selected && <Check className="size-4 shrink-0 text-logo-green" aria-hidden />}
          </span>
          <span className="ui-body-tight mt-1 block text-[13px] text-arcade-muted">
            {unlocked ? BOARD_CATEGORY_LABEL[board.category] : board.unlockLabel}
          </span>
          {!unlocked && progress && (
            <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-arcade-surface">
              <span
                className="block h-full rounded-full bg-logo-green"
                style={{ width: `${Math.round(progress.ratio * 100)}%` }}
              />
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

/** Board Collection — browse, preview and equip unlockable environments. */
export function BoardCollectionScreen({
  open,
  selectedBoardId,
  context,
  effectsEnabled,
  reducedMotion,
  onSelect,
  onClose,
}: BoardCollectionScreenProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const unlockedIds = useMemo(
    () => BOARDS.filter((b) => isBoardUnlocked(b, context)).map((b) => b.id),
    [context],
  );

  const grouped = useMemo(() => {
    const visible = BOARDS.filter((b) => {
      const unlocked = unlockedIds.includes(b.id);
      if (filter === "unlocked") return unlocked;
      if (filter === "locked") return !unlocked;
      return true;
    });
    const out: { category: BoardCategory; boards: BoardDefinition[] }[] = [];
    for (const board of visible) {
      const bucket = out.find((g) => g.category === board.category);
      if (bucket) bucket.boards.push(board);
      else out.push({ category: board.category, boards: [board] });
    }
    return out;
  }, [filter, unlockedIds]);

  const preview = previewId ? boardById(previewId) : null;
  const previewUnlocked = preview ? unlockedIds.includes(preview.id) : false;
  const previewProgress = preview ? boardUnlockProgress(preview, context) : null;

  return (
    <Sheet
      open={open}
      title="Board Collection"
      onClose={() => {
        setPreviewId(null);
        onClose();
      }}
    >
      <p className="ui-body text-[15px] text-arcade-muted">
        {unlockedIds.length} of {BOARDS.length} boards unlocked. Boards change the environment only
        — targets, timing and scoring stay identical.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {(["all", "unlocked", "locked"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`ui-title rounded-xl border px-3 py-2 text-[12px] tracking-[0.14em] ${
              filter === f
                ? "border-logo-green text-logo-green"
                : "border-arcade-line text-arcade-muted"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {grouped.map((group) => (
        <section key={group.category} className="mt-5">
          <h3 className="sticker-sm text-[12px] tracking-[0.18em] text-arcade-text/90">
            {BOARD_CATEGORY_LABEL[group.category].toUpperCase()}
          </h3>
          <ul className="mt-2.5 grid grid-cols-2 gap-2.5">
            {group.boards.map((board) => (
              <BoardTile
                key={board.id}
                board={board}
                unlocked={unlockedIds.includes(board.id)}
                selected={board.id === selectedBoardId}
                context={context}
                onPreview={setPreviewId}
              />
            ))}
          </ul>
        </section>
      ))}

      {preview && (
        <div className="fixed inset-0 z-[90] grid place-items-end bg-arcade-bg-deep/85 p-4 sm:place-items-center">
          <div className="arcade-panel relative w-full max-w-md overflow-hidden">
            <div className="relative h-40 w-full overflow-hidden">
              <BoardEnvironment
                boardId={preview.id}
                effectsEnabled={effectsEnabled}
                reducedMotion={reducedMotion}
              />
              <div className="absolute inset-0 grid place-items-center gap-3">
                <div className="flex gap-4">
                  <span className="size-9 rounded-full bg-neon-green shadow-[0_0_18px_var(--neon-green)]" />
                  <span className="size-9 rounded-full bg-neon-gold shadow-[0_0_18px_var(--neon-gold)]" />
                  <span className="size-9 rounded-full bg-neon-purple shadow-[0_0_18px_var(--neon-purple)]" />
                  <span className="size-9 rounded-full bg-neon-red shadow-[0_0_18px_var(--neon-red)]" />
                </div>
              </div>
            </div>

            <div className="p-5">
              <h3 className="ui-title text-xl">{preview.name}</h3>
              <p className="ui-body mt-1.5 text-[15px] text-arcade-muted">{preview.description}</p>
              <p className="ui-body-tight mt-2 text-[14px] text-arcade-text/90">
                {previewUnlocked
                  ? "Unlocked"
                  : previewProgress
                    ? `${preview.unlockLabel} · ${previewProgress.value}/${previewProgress.target}`
                    : preview.unlockLabel}
              </p>

              <div className="mt-4 grid gap-2.5">
                <ArcButton
                  tone={previewUnlocked ? "green" : "steel"}
                  onClick={() => {
                    if (!previewUnlocked) return;
                    onSelect(preview.id);
                    setPreviewId(null);
                  }}
                >
                  {previewUnlocked
                    ? preview.id === selectedBoardId
                      ? "EQUIPPED"
                      : "EQUIP BOARD"
                    : "LOCKED"}
                </ArcButton>
                <button
                  type="button"
                  onClick={() => setPreviewId(null)}
                  className="ui-title rounded-xl border border-arcade-line px-4 py-3 text-[13px] tracking-[0.14em] text-arcade-muted"
                >
                  CLOSE PREVIEW
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
