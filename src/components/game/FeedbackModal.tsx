import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_MAX_LENGTH,
  feedbackAvailable,
  feedbackBody,
  feedbackMailto,
  feedbackSubject,
} from "@/game/feedback";
import type { FeedbackCategory } from "@/game/trainingTypes";
import { openExternalUrl } from "@/lib/urlSafety";
import { Sheet } from "./Sheet";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Composes an email in the player's own mail client. Nothing is sent
 * automatically and the full message is previewed before opening the client.
 */
export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const available = feedbackAvailable();
  const trimmed = message.trim();
  const preview = useMemo(() => feedbackBody({ category, message }), [category, message]);

  return (
    <Sheet open={open} title="Send Feedback" onClose={onClose}>
      {!available ? (
        <p className="ui-body text-[15px] text-arcade-text/95">
          Feedback isn't available yet because no support inbox has been configured for this build.
        </p>
      ) : (
        <>
          <p className="ui-body text-[15px] text-arcade-text/95">
            Your feedback opens in your own email app. Nothing is sent automatically and no personal
            data is collected.
          </p>

          <fieldset className="mt-5">
            <legend className="sticker-sm text-[11px] tracking-[0.24em] text-arcade-text/80">
              CATEGORY
            </legend>
            <div className="mt-3 grid gap-2">
              {FEEDBACK_CATEGORIES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={category === option.id}
                  onClick={() => setCategory(option.id)}
                  className={`rounded-2xl border px-4 py-3 text-left ${
                    category === option.id
                      ? "border-neon-green bg-arcade-surface"
                      : "border-arcade-line bg-arcade-surface/70"
                  }`}
                >
                  <span className="block text-sm font-black text-arcade-text">{option.label}</span>
                  <span className="ui-body-tight block text-[13px] text-arcade-muted">
                    {option.hint}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className="mt-6 block">
            <span className="sticker-sm text-[11px] tracking-[0.24em] text-arcade-text/80">
              MESSAGE
            </span>
            <textarea
              value={message}
              maxLength={FEEDBACK_MAX_LENGTH}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="What happened, and what did you expect instead?"
              className="mt-2 w-full rounded-2xl border border-arcade-line bg-arcade-surface px-4 py-3 text-[15px] font-medium text-arcade-text outline-none focus:border-neon-green"
            />
            <span className="ui-body mt-1 block text-right text-[12px] text-arcade-muted tabular-nums">
              {trimmed.length}/{FEEDBACK_MAX_LENGTH}
            </span>
          </label>

          <details className="mt-3 rounded-2xl border border-arcade-line bg-arcade-surface/60 px-4 py-3">
            <summary className="ui-title cursor-pointer text-[14px] text-arcade-text/95">
              Preview exactly what will be sent
            </summary>
            <p className="sticker-sm mt-2 text-[11px] tracking-[0.12em] text-arcade-muted">
              SUBJECT
            </p>
            <p className="ui-body text-[14px] text-arcade-text/95">{feedbackSubject(category)}</p>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[12px] leading-relaxed text-arcade-muted">
              {preview}
            </pre>
          </details>

          <button
            type="button"
            disabled={trimmed.length === 0}
            onClick={() => {
              const url = feedbackMailto({ category, message });
              if (!url) return;
              openExternalUrl(url);
              setSent(true);
              window.setTimeout(() => setSent(false), 2500);
            }}
            className="arcade-btn sticker-sm mt-6 flex min-h-14 w-full items-center justify-center gap-2 bg-neon-green py-4 text-lg text-arcade-bg-deep disabled:opacity-50"
          >
            <Send className="size-4" aria-hidden /> Open Email App
          </button>
          {sent && (
            <p
              className="sticker-sm mt-2 text-center text-[12px] tracking-[0.14em] text-neon-green"
              aria-live="polite"
            >
              Opened your email app — thank you!
            </p>
          )}
        </>
      )}
    </Sheet>
  );
}
