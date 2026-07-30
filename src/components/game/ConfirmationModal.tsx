import { useEffect, useState } from "react";

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  body: string;
  bullets?: string[];
  confirmLabel: string;
  /** requires a second explicit confirmation before firing */
  doubleConfirm?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  open,
  title,
  body,
  bullets,
  confirmLabel,
  doubleConfirm = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!open) setArmed(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const needsSecond = doubleConfirm && !armed;

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-arcade-bg-deep/92 p-5"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="arcade-panel w-[min(92vw,420px)] p-6">
        <h2 className="sticker-sm text-xl tracking-tight text-neon-red glow-red">{title}</h2>
        <p className="mt-3 text-sm font-semibold text-arcade-text">{body}</p>
        {bullets && bullets.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm font-semibold text-arcade-text/85">
            {bullets.map((b) => (
              <li key={b}>• {b}</li>
            ))}
          </ul>
        )}
        {needsSecond ? (
          <p className="sticker-sm mt-4 text-[11px] tracking-[0.16em] text-neon-gold glow-gold">
            TAP CONFIRM TWICE TO DELETE
          </p>
        ) : (
          doubleConfirm && (
            <p className="sticker-sm mt-4 text-[11px] tracking-[0.16em] text-neon-red glow-red">
              ARE YOU SURE? THIS CANNOT BE UNDONE
            </p>
          )
        )}
        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => {
              if (needsSecond) {
                setArmed(true);
                return;
              }
              onConfirm();
            }}
            className="arcade-btn sticker-sm bg-neon-red py-4 text-base text-arcade-text"
          >
            {needsSecond ? confirmLabel : `Yes — ${confirmLabel}`}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="arcade-btn sticker-sm border border-arcade-line bg-arcade-surface py-4 text-base text-arcade-text"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
