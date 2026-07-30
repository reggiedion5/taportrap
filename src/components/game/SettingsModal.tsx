import { useState } from "react";
import { ExternalLink, Mail, ShieldCheck, X } from "lucide-react";
import type { GameSettings } from "@/game/types";
import {
  APP_NAME,
  IS_DEV,
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_URL,
  SUPPORT_EMAIL,
  SUPPORT_URL,
  versionLabel,
} from "@/lib/appConfig";
import {
  isTrustedExternalUrl,
  openExternalUrl,
  openSupportEmail,
  supportEmailConfigured,
} from "@/lib/urlSafety";
import { storageDebugSummary } from "@/lib/storageHealth";
import { formatReleaseReport, validateRelease } from "@/lib/releaseValidation";

interface SettingsModalProps {
  open: boolean;
  settings: GameSettings;
  onChange: (next: Partial<GameSettings>) => void;
  onResetAllData: () => void;
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
      className="grid min-h-14 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-arcade-line bg-arcade-surface px-4 py-4 text-left"
    >
      <span className="min-w-0">
        <span className="block text-base font-bold text-arcade-text">{label}</span>
        <span className="block text-xs font-medium text-arcade-text/80">{description}</span>
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

function LinkRow({
  label,
  hint,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="grid min-h-14 w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-arcade-line bg-arcade-surface px-4 py-3 text-left disabled:opacity-50"
    >
      <span className="text-arcade-text/80">{icon}</span>
      <span className="min-w-0">
        <span className="block text-base font-bold text-arcade-text">{label}</span>
        <span className="block truncate text-xs font-medium text-arcade-text/75">{hint}</span>
      </span>
    </button>
  );
}

export function SettingsModal({
  open,
  settings,
  onChange,
  onResetAllData,
  onClose,
}: SettingsModalProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [diagnostics, setDiagnostics] = useState<string | null>(null);

  if (!open) return null;

  const supportPageReady = isTrustedExternalUrl(SUPPORT_URL);
  const privacyReady = isTrustedExternalUrl(PRIVACY_URL);
  const emailReady = supportEmailConfigured();

  return (
    <div className="no-select fixed inset-0 z-50 grid place-items-center bg-arcade-bg-deep/85 p-5 backdrop-blur-sm">
      <div className="arcade-panel safe-area max-h-[92dvh] w-[min(90vw,400px)] overflow-y-auto p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <h2 className="truncate text-2xl font-black text-arcade-text">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="arcade-btn grid size-11 shrink-0 place-items-center border border-arcade-line bg-arcade-surface text-arcade-text"
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

        <h3 className="sticker-sm mt-7 text-sm text-arcade-text/85">Support</h3>
        <div className="mt-3 grid gap-3">
          <LinkRow
            label="Help & Support"
            hint={supportPageReady ? SUPPORT_URL : "Not configured yet"}
            icon={<ExternalLink className="size-5" aria-hidden />}
            disabled={!supportPageReady}
            onClick={() => openExternalUrl(SUPPORT_URL)}
          />
          <LinkRow
            label="Email Support"
            hint={emailReady ? SUPPORT_EMAIL : "Not configured yet"}
            icon={<Mail className="size-5" aria-hidden />}
            disabled={!emailReady}
            onClick={() => openSupportEmail(`${APP_NAME} ${versionLabel()} — support`)}
          />
          <LinkRow
            label="Privacy Policy"
            hint={
              privacyReady
                ? PRIVACY_EFFECTIVE_DATE
                  ? `Effective ${PRIVACY_EFFECTIVE_DATE}`
                  : PRIVACY_URL
                : "Not configured yet"
            }
            icon={<ShieldCheck className="size-5" aria-hidden />}
            disabled={!privacyReady}
            onClick={() => openExternalUrl(PRIVACY_URL)}
          />
        </div>

        <h3 className="sticker-sm mt-7 text-sm text-arcade-text/85">Your data</h3>
        <p className="mt-2 text-xs font-medium text-arcade-text/75">
          {APP_NAME} works fully offline. Scores, XP, achievements and settings are stored only on
          this device — nothing is uploaded, and no account is required.
        </p>

        {confirmReset ? (
          <div className="mt-3 grid gap-3 rounded-2xl border border-neon-red/60 bg-neon-red/10 p-4">
            <p className="text-sm font-bold text-neon-red">
              Delete all local data? Scores, XP, achievements, statistics and unlocked themes on
              this device are permanently removed. This cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => {
                onResetAllData();
                setConfirmReset(false);
              }}
              className="arcade-btn sticker-sm min-h-12 border border-neon-red bg-neon-red/20 py-3 text-base text-neon-red"
            >
              Delete everything
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="arcade-btn sticker-sm min-h-12 border border-arcade-line bg-arcade-surface py-3 text-base text-arcade-text"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="arcade-btn sticker-sm mt-3 min-h-12 w-full border border-neon-red/60 bg-arcade-surface py-3 text-base text-neon-red"
          >
            Reset All Data
          </button>
        )}

        <h3 className="sticker-sm mt-7 text-sm text-arcade-text/85">About</h3>
        <p className="mt-2 text-xs font-medium text-arcade-text/75">
          {APP_NAME} · Version {versionLabel()}
        </p>

        {IS_DEV && (
          <div className="mt-5 rounded-2xl border border-dashed border-arcade-line p-4">
            <p className="sticker-sm text-xs text-arcade-text/70">Developer diagnostics</p>
            <button
              type="button"
              onClick={() =>
                setDiagnostics(
                  `${formatReleaseReport(validateRelease())}\n\n${JSON.stringify(
                    storageDebugSummary(),
                    null,
                    2,
                  )}`,
                )
              }
              className="arcade-btn sticker-sm mt-3 min-h-11 w-full border border-arcade-line bg-arcade-surface py-2 text-sm text-arcade-text"
            >
              Run release check
            </button>
            {diagnostics && (
              <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-arcade-text/80">
                {diagnostics}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
