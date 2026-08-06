import { useState } from "react";
import { Download, ExternalLink, Mail, ShieldCheck, Upload } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import {
  APP_NAME,
  APP_TAGLINE,
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
import { Sheet } from "./Sheet";
import { ChromeCard } from "./ArcUI";
import { BackupPanel } from "./BackupPanel";

interface AboutScreenProps {
  open: boolean;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenSupport: () => void;
  onImported: () => void;
  onClose: () => void;
}

/** Identity, version, legal entry points and local progress backup. */
export function AboutScreen({
  open,
  onOpenPrivacy,
  onOpenTerms,
  onOpenSupport,
  onImported,
  onClose,
}: AboutScreenProps) {
  const [tab, setTab] = useState<"about" | "backup">("about");
  const supportReady = isTrustedExternalUrl(SUPPORT_URL);
  const privacyReady = isTrustedExternalUrl(PRIVACY_URL);
  const emailReady = supportEmailConfigured();

  return (
    <Sheet open={open} title={`About ${APP_NAME}`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        {(["about", "backup"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-pressed={tab === value}
            className={`arcade-btn ui-title min-h-11 border px-4 py-2 text-[15px] ${
              tab === value
                ? "border-neon-green bg-neon-green/15 text-neon-green"
                : "border-arcade-line bg-arcade-surface text-arcade-text"
            }`}
          >
            {value === "about" ? "About" : "Your data"}
          </button>
        ))}
      </div>

      {tab === "about" ? (
        <div className="mt-5 grid gap-4">
          <ChromeCard>
            <div className="grid place-items-center gap-3 px-4 py-6 text-center">
              <img
                src={logoAsset.url}
                alt={`${APP_NAME} logo`}
                width={160}
                height={160}
                className="h-24 w-auto"
              />
              <h3 className="sticker-text text-2xl text-arcade-text">{APP_NAME}</h3>
              <p className="ui-body text-[15px] text-arcade-muted">{APP_TAGLINE}</p>
              <p className="ui-body-tight text-[14px] text-arcade-muted">
                Version {versionLabel()}
              </p>
            </div>
          </ChromeCard>

          <p className="ui-prose text-[15px] text-arcade-text/95">
            {APP_NAME} is a single-player reaction arcade game. Tap the safe targets, avoid the
            traps, keep your combo alive and climb your own records. Everything runs on this device
            and works offline — there is no account and no cloud save.
          </p>

          <div>
            <h4 className="sticker-sm text-[13px] tracking-[0.16em] text-arcade-text/90">
              ACKNOWLEDGMENTS
            </h4>
            <p className="ui-prose mt-2 text-[15px] text-arcade-muted">
              Built with React, TanStack Start and Capacitor. Interface icons by Lucide (ISC
              licence). Sound and music are generated locally with the Web Audio API — no
              third-party audio assets are bundled.
            </p>
          </div>

          <div className="grid gap-3">
            <Row
              label="Privacy Policy"
              hint="What is stored and where"
              icon={<ShieldCheck className="size-5" aria-hidden />}
              onClick={onOpenPrivacy}
            />
            <Row
              label="Terms of Use"
              hint="Rules for using the game"
              icon={<ShieldCheck className="size-5" aria-hidden />}
              onClick={onOpenTerms}
            />
            <Row
              label="Help & Support"
              hint="Guides, troubleshooting and feedback"
              icon={<ExternalLink className="size-5" aria-hidden />}
              onClick={onOpenSupport}
            />
            {privacyReady && (
              <Row
                label="Privacy Policy (web)"
                hint={PRIVACY_URL}
                icon={<ExternalLink className="size-5" aria-hidden />}
                onClick={() => openExternalUrl(PRIVACY_URL)}
              />
            )}
            {supportReady && (
              <Row
                label="Support site"
                hint={SUPPORT_URL}
                icon={<ExternalLink className="size-5" aria-hidden />}
                onClick={() => openExternalUrl(SUPPORT_URL)}
              />
            )}
            {emailReady && (
              <Row
                label="Email support"
                hint={SUPPORT_EMAIL}
                icon={<Mail className="size-5" aria-hidden />}
                onClick={() => openSupportEmail(`${APP_NAME} ${versionLabel()} — support`)}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <div className="mb-4 flex items-center gap-3 text-arcade-muted">
            <Download className="size-5" aria-hidden />
            <Upload className="size-5" aria-hidden />
            <span className="ui-body-tight text-[14px]">
              Backups stay on this device unless you share them yourself.
            </span>
          </div>
          <BackupPanel onImported={onImported} />
        </div>
      )}
    </Sheet>
  );
}

function Row({
  label,
  hint,
  icon,
  onClick,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid min-h-14 w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-arcade-line bg-arcade-surface px-4 py-3 text-left"
    >
      <span className="text-arcade-text/80">{icon}</span>
      <span className="min-w-0">
        <span className="ui-title block text-base">{label}</span>
        <span className="ui-body-tight mt-0.5 block truncate text-[14px] text-arcade-muted">
          {hint}
        </span>
      </span>
    </button>
  );
}
