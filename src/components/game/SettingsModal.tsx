import { useState } from "react";
import { ExternalLink, Mail, MessageSquarePlus, ShieldCheck, Trash2, X } from "lucide-react";
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
import { DataResetSheet, type ResetScope } from "./DataResetSheet";

interface SettingsModalProps {
  open: boolean;
  settings: GameSettings;
  onChange: (next: Partial<GameSettings>) => void;
  onReset: (scope: ResetScope) => void;
  onOpenFeedback: () => void;
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
      className="chrome-card btn-arc w-full text-left"
    >
      <span className="chrome-face grid min-h-14 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4">
        <span className="min-w-0">
          <span className="ui-title block text-base">{label}</span>
          <span className="ui-body-tight mt-0.5 block text-[14px] text-arcade-muted">
            {description}
          </span>
        </span>
        <span
          className={`relative h-7 w-12 shrink-0 rounded-full border transition-all ${
            checked
              ? "border-logo-green/70 bg-[linear-gradient(180deg,oklch(0.93_0.22_142),var(--logo-green-deep))] shadow-[0_0_16px_-2px_var(--logo-green),inset_0_1px_0_oklch(1_0_0_/_0.5)]"
              : "border-logo-red/50 bg-[linear-gradient(180deg,oklch(0.42_0.16_28),oklch(0.24_0.08_28))] shadow-[inset_0_1px_0_oklch(1_0_0_/_0.2)]"
          }`}
        >
          <span
            className={`absolute top-1 size-5 rounded-full bg-[linear-gradient(180deg,var(--chrome-hi),var(--chrome-lo))] shadow-[0_1px_3px_oklch(0_0_0_/_0.7)] transition-all ${
              checked ? "left-6" : "left-1"
            }`}
          />
        </span>
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
        <span className="ui-title block text-base">{label}</span>
        <span className="ui-body-tight mt-0.5 block truncate text-[14px] text-arcade-muted">{hint}</span>
      </span>
    </button>
  );
}

export function SettingsModal({
  open,
  settings,
  onChange,
  onReset,
  onOpenFeedback,
  onClose,
}: SettingsModalProps) {
  const [resetOpen, setResetOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState<string | null>(null);


  if (!open) return null;

  const supportPageReady = isTrustedExternalUrl(SUPPORT_URL);
  const privacyReady = isTrustedExternalUrl(PRIVACY_URL);
  const emailReady = supportEmailConfigured();

  return (
    <div className="no-select fixed inset-0 z-50 grid place-items-center bg-arcade-bg-deep/85 p-5 backdrop-blur-sm">
      <div className="arcade-panel safe-area max-h-[92dvh] w-[min(90vw,400px)] overflow-y-auto p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <h2 className="ui-title truncate text-2xl font-extrabold text-arcade-text">Settings</h2>
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
            label="Music"
            description="Looping arcade background track"
            checked={settings.music}
            onChange={(v) => onChange({ music: v })}
          />
          <Toggle
            label="Haptic feedback"
            description="Vibration on taps, combos and traps"
            checked={settings.vibration}
            onChange={(v) => onChange({ vibration: v })}
          />
          <Toggle
            label="Screen shake"
            description="Impact shake when you hit a trap"
            checked={settings.screenShake}
            onChange={(v) => onChange({ screenShake: v })}
          />
          <Toggle
            label="Reduced motion"
            description="Calmer animations, no screen shake"
            checked={settings.reducedMotion}
            onChange={(v) => onChange({ reducedMotion: v })}
          />
          <Toggle
            label="Skip countdown"
            description="Start runs instantly instead of 3 · 2 · 1"
            checked={settings.skipCountdown}
            onChange={(v) => onChange({ skipCountdown: v })}
          />
          <Toggle
            label="Kids Assist"
            description="Bigger, slower, friendlier targets in training"
            checked={settings.kidsAssist}
            onChange={(v) => onChange({ kidsAssist: v })}
          />
        </div>

        <h3 className="sticker-sm mt-7 text-[13px] tracking-[0.16em] text-arcade-text/90">SUPPORT</h3>
        <div className="mt-3 grid gap-3">
          <LinkRow
            label="Send Feedback"
            hint="Report a bug or suggest an idea"
            icon={<MessageSquarePlus className="size-5" aria-hidden />}
            disabled={false}
            onClick={onOpenFeedback}
          />
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

        <h3 className="sticker-sm mt-7 text-[13px] tracking-[0.16em] text-arcade-text/90">YOUR DATA</h3>
        <p className="ui-body mt-2.5 text-[15px] text-arcade-muted">
          {APP_NAME} works fully offline. Scores, XP, achievements and settings are stored only on
          this device — nothing is uploaded, and no account is required.
        </p>

        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="arcade-btn ui-title mt-3 grid min-h-12 w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border border-neon-red/60 bg-arcade-surface px-4 py-3 text-left text-base text-neon-red"
        >
          <Trash2 className="size-5" aria-hidden />
          <span>Reset Data…</span>
        </button>


        <h3 className="sticker-sm mt-7 text-[13px] tracking-[0.16em] text-arcade-text/90">ABOUT</h3>
        <p className="ui-body mt-2.5 text-[15px] text-arcade-text/95">
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
              className="arcade-btn ui-title mt-3 min-h-11 w-full border border-arcade-line bg-arcade-surface py-2 text-[15px] text-arcade-text"
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

      <DataResetSheet
        open={resetOpen}
        onReset={(scope) => {
          onReset(scope);
          setResetOpen(false);
        }}
        onClose={() => setResetOpen(false)}
      />

    </div>
  );
}
