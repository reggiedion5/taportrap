import { useCallback, useState } from "react";
import { Share2 } from "lucide-react";
import {
  shareOutcomeMessage,
  shareResult,
  type ShareResultData,
} from "@/game/shareResult";

interface ShareButtonProps {
  data: ShareResultData;
  className?: string;
  label?: string;
}

/**
 * Single share entry point. Shows the exact text that will be sent, and never
 * reports an error when the player simply dismisses the share sheet.
 */
export function ShareButton({ data, className, label = "Share Result" }: ShareButtonProps) {
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onShare = useCallback(
    async (event: React.MouseEvent) => {
      event.stopPropagation();
      if (busy) return;
      setBusy(true);
      const outcome = await shareResult(data);
      setBusy(false);
      const message = shareOutcomeMessage(outcome);
      setNote(message);
      if (message) window.setTimeout(() => setNote(null), 2200);
    },
    [busy, data],
  );

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={onShare}
        disabled={busy}
        className={
          className ??
          "arcade-btn sticker-sm flex min-h-12 items-center justify-center gap-2 border border-arcade-line bg-arcade-surface py-4 text-sm text-arcade-text disabled:opacity-60"
        }
      >
        <Share2 className="size-4" aria-hidden /> {label}
      </button>
      {note && (
        <p
          className="sticker-sm text-center text-xs tracking-[0.16em] text-neon-green glow-green"
          aria-live="polite"
        >
          {note}
        </p>
      )}
    </div>
  );
}
