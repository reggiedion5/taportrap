import { X } from "lucide-react";
import type { GameSettings } from "@/game/types";

interface SettingsModalProps {
  open: boolean;
  settings: GameSettings;
  onChange: (next: Partial<GameSettings>) => void;
  onClose: () => void;
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-arcade-line bg-arcade-surface px-4 py-4 text-left"
    >
      <span className="min-w-0">
        <span className="block text-base font-bold text-arcade-text">
          {label}
        </span>
        <span className="block text-xs font-medium text-arcade-text/80">
          {description}
        </span>
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-neon-green" : "bg-arcade-line"
        }`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-arcade-text transition-all ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

export function SettingsModal({
  open,
  settings,
  onChange,
  onClose,
}: SettingsModalProps) {
  if (!open) return null;

  return (
    <div className="no-select fixed inset-0 z-50 grid place-items-center bg-arcade-bg-deep/85 p-5 backdrop-blur-sm">
      <div className="arcade-panel w-[min(90vw,400px)] p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <h2 className="truncate text-2xl font-black text-arcade-text">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="arcade-btn grid size-10 shrink-0 place-items-center border border-arcade-line bg-arcade-surface text-arcade-text"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-3">
          <Toggle
            label="Sound"
            description="Arcade blips via Web Audio"
            checked={settings.sound}
            onChange={(v) => onChange({ sound: v })}
          />
          <Toggle
            label="Vibration"
            description="Haptic feedback on supported devices"
            checked={settings.vibration}
            onChange={(v) => onChange({ vibration: v })}
          />
          <Toggle
            label="Reduced motion"
            description="Calmer animations, no screen shake"
            checked={settings.reducedMotion}
            onChange={(v) => onChange({ reducedMotion: v })}
          />
        </div>
      </div>
    </div>
  );
}
