import { APP_NAME, PRIVACY_EFFECTIVE_DATE, PRIVACY_URL, SUPPORT_EMAIL } from "@/lib/appConfig";
import { analyticsEnabled } from "@/lib/analytics";
import { isTrustedExternalUrl, openExternalUrl, supportEmailConfigured } from "@/lib/urlSafety";
import { Sheet } from "./Sheet";
import { BackupPanel } from "./BackupPanel";

interface PrivacyCenterScreenProps {
  open: boolean;
  onOpenTerms: () => void;
  onOpenSupport: () => void;
  onImported: () => void;
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <h3 className="sticker-sm text-[13px] tracking-[0.16em] text-arcade-text/90">{title}</h3>
      <div className="ui-prose mt-2 grid gap-2 text-[15px] text-arcade-text/95">{children}</div>
    </section>
  );
}

/** Plain-language, accurate description of what this build does with data. */
export function PrivacyCenterScreen({
  open,
  onOpenTerms,
  onOpenSupport,
  onImported,
  onClose,
}: PrivacyCenterScreenProps) {
  const analytics = analyticsEnabled();
  const webPrivacy = isTrustedExternalUrl(PRIVACY_URL);

  return (
    <Sheet open={open} title="Privacy" onClose={onClose}>
      <p className="ui-body text-[15px] text-arcade-muted">
        {PRIVACY_EFFECTIVE_DATE
          ? `Effective ${PRIVACY_EFFECTIVE_DATE}`
          : "Draft — this text must be reviewed before release."}
      </p>

      <Section title="WHAT IS STORED">
        <p>
          {APP_NAME} stores your scores, records, XP and level, achievements, missions and
          challenges, unlocked boards, titles and badges, run history, and your settings.
        </p>
      </Section>

      <Section title="WHERE IT IS STORED">
        <p>
          All of it is kept in this app&apos;s own local storage on this device. There is no
          account, no login and no cloud save.
        </p>
      </Section>

      <Section title="DOES DATA LEAVE THE DEVICE">
        <p>
          No. The game never uploads your progress. Data only leaves the device if you choose to
          share a result, export a backup, or send a feedback report yourself.
        </p>
      </Section>

      <Section title="ANALYTICS">
        <p>
          {analytics
            ? "Anonymous gameplay analytics are enabled. No personal data, device identifiers, advertising identifiers or location are collected."
            : "Analytics are disabled. The game sends no usage events anywhere."}
        </p>
      </Section>

      <Section title="CRASH REPORTING">
        <p>
          No automatic crash reporting is configured. If something goes wrong you can copy the error
          details yourself and include them in a feedback report.
        </p>
      </Section>

      <Section title="PERMISSIONS">
        <p>
          {APP_NAME} does not request location, contacts, camera, microphone, photos, or app
          tracking permission. Vibration and audio use device features only while you play.
        </p>
      </Section>

      <Section title="SHARING">
        <p>
          Share Result creates a short text summary of the run you just played. You choose where it
          goes; nothing is sent automatically.
        </p>
      </Section>

      <Section title="CHILDREN">
        <p>
          The game has no chat, no user accounts, no purchases and no advertising. Kids Assist is a
          local accessibility option only.
        </p>
      </Section>

      <Section title="YOUR DATA CONTROLS">
        <BackupPanel onImported={onImported} />
      </Section>

      <Section title="MORE">
        <div className="grid gap-2">
          <button
            type="button"
            onClick={onOpenTerms}
            className="arcade-btn ui-title min-h-12 w-full border border-arcade-line bg-arcade-surface py-3 text-base text-arcade-text"
          >
            Terms of Use
          </button>
          <button
            type="button"
            onClick={onOpenSupport}
            className="arcade-btn ui-title min-h-12 w-full border border-arcade-line bg-arcade-surface py-3 text-base text-arcade-text"
          >
            Help &amp; Support
          </button>
          {webPrivacy && (
            <button
              type="button"
              onClick={() => openExternalUrl(PRIVACY_URL)}
              className="arcade-btn ui-title min-h-12 w-full border border-arcade-line bg-arcade-surface py-3 text-base text-arcade-text"
            >
              Open the web privacy policy
            </button>
          )}
          {supportEmailConfigured() && (
            <p className="ui-body-tight text-[14px] text-arcade-muted">
              Privacy questions: {SUPPORT_EMAIL}
            </p>
          )}
        </div>
      </Section>
    </Sheet>
  );
}
