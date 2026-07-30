import { Check, Lock } from "lucide-react";
import { THEMES, isThemeUnlocked, themeUnlockProgress } from "@/game/themes";
import type { ThemeDefinition } from "@/game/progressionTypes";
import type { ThemeUnlockContext } from "@/game/themes";
import { Sheet } from "./Sheet";

interface ThemeCardProps {
  theme: ThemeDefinition;
  unlocked: boolean;
  selected: boolean;
  context: ThemeUnlockContext;
  onSelect: (id: string) => void;
}

export function ThemeCard({ theme, unlocked, selected, context, onSelect }: ThemeCardProps) {
  const progress = themeUnlockProgress(theme, context);
  return (
    <li>
      <button
        type="button"
        disabled={!unlocked}
        aria-pressed={selected}
        onClick={() => unlocked && onSelect(theme.id)}
        className={`arcade-panel w-full p-4 text-left ${
          selected ? "border-2 border-neon-green" : ""
        } ${unlocked ? "" : "cursor-not-allowed opacity-80"}`}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="sticker-sm text-base tracking-tight text-arcade-text">{theme.name}</span>
          <span className="sticker-sm flex shrink-0 items-center gap-1 text-[10px] tracking-[0.16em] text-arcade-text">
            {!unlocked ? (
              <>
                <Lock className="size-4" aria-hidden /> LOCKED
              </>
            ) : selected ? (
              <>
                <Check className="size-4 text-neon-green" aria-hidden /> SELECTED
              </>
            ) : (
              "UNLOCKED"
            )}
          </span>
        </span>

        <span className="mt-3 flex gap-2" aria-hidden>
          {theme.swatch.map((color) => (
            <span
              key={color}
              className="size-8 rounded-xl border border-arcade-line"
              style={{ background: color }}
            />
          ))}
        </span>

        <span className="mt-3 block text-sm font-semibold text-arcade-text/85">
          {theme.description}
        </span>
        <span className="mt-2 block text-xs font-bold text-arcade-text/80">
          {unlocked ? "Unlocked" : theme.unlockLabel}
          {!unlocked && progress
            ? ` · ${Math.min(progress.value, progress.target)}/${progress.target}`
            : ""}
        </span>
      </button>
    </li>
  );
}

interface ThemeScreenProps {
  open: boolean;
  selectedTheme: string;
  context: ThemeUnlockContext;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function ThemeScreen({ open, selectedTheme, context, onSelect, onClose }: ThemeScreenProps) {
  return (
    <Sheet open={open} title="Themes" onClose={onClose}>
      <p className="text-sm font-semibold text-arcade-text/85">
        Themes change presentation only. Target colours and labels stay identical in every theme.
      </p>
      <ul className="mt-4 grid gap-3">
        {THEMES.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            unlocked={isThemeUnlocked(theme, context)}
            selected={theme.id === selectedTheme}
            context={context}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </Sheet>
  );
}
