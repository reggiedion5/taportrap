import { useEffect, useState } from "react";
import { playSound } from "@/game/audio";
import { ArcadeBackdrop } from "./ArcadeBackdrop";
import { CountdownOverlay } from "./CountdownOverlay";

const SEQUENCE = ["3", "2", "1", "GO"];
const STEP_MS = 620;

interface PreGameCountdownProps {
  title: string;
  reducedMotion: boolean;
  onDone: () => void;
  onCancel: () => void;
}

/** Standalone 3 · 2 · 1 · GO gate shown before a competitive run starts. */
export function PreGameCountdown({
  title,
  reducedMotion,
  onDone,
  onCancel,
}: PreGameCountdownProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    playSound("countdown");
    if (index === SEQUENCE.length - 1) {
      const id = window.setTimeout(onDone, STEP_MS);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setIndex((i) => i + 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [index, onDone]);

  return (
    <div className="no-select safe-area relative min-h-[100dvh] overflow-hidden">
      <ArcadeBackdrop />
      <div className="relative grid min-h-[100dvh] place-items-center">
        <p className="sticker-sm absolute top-8 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.3em] text-arcade-text/80">
          {title.toUpperCase()}
        </p>
        <CountdownOverlay label={SEQUENCE[index]} reducedMotion={reducedMotion} />
        <button
          type="button"
          onClick={onCancel}
          className="absolute bottom-10 left-1/2 z-40 -translate-x-1/2 text-xs font-bold tracking-[0.2em] text-arcade-text/70 underline"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
