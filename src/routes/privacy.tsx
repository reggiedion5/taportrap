import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_NAME, PRIVACY_EFFECTIVE_DATE, SUPPORT_EMAIL } from "@/lib/appConfig";
import { supportEmailConfigured } from "@/lib/urlSafety";

const TITLE = "Privacy Policy — Tap or Trap!";
const DESCRIPTION =
  "Tap or Trap! collects no personal data. Everything the game saves stays on your device and can be deleted at any time.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="sticker-sm text-sm text-arcade-text/85">{title}</h2>
      <div className="mt-3 grid gap-3 text-sm font-medium leading-relaxed text-arcade-text/80">
        {children}
      </div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <main className="safe-area mx-auto w-full max-w-2xl px-5 py-10">
      <p className="sticker-sm text-[12px] tracking-[0.14em] text-arcade-muted">{APP_NAME}</p>
      <h1 className="mt-2 text-3xl font-black text-arcade-text">Privacy Policy</h1>
      <p className="ui-body mt-2 text-[14px] text-arcade-muted">
        {PRIVACY_EFFECTIVE_DATE ? `Effective ${PRIVACY_EFFECTIVE_DATE}` : "Effective date pending"}
      </p>

      <Section title="Summary">
        <p>
          {APP_NAME} does not collect, transmit, or sell any personal information. The game runs
          entirely on your device and works with no internet connection.
        </p>
      </Section>

      <Section title="Information we collect">
        <p>
          <span className="text-arcade-text">None.</span> We do not collect personal information,
          contact details, location, device identifiers, advertising identifiers, or usage
          analytics.
        </p>
      </Section>

      <Section title="Information stored on your device">
        <p>
          The game saves the following locally, inside the app&apos;s own storage. It never leaves
          your device and we cannot access it:
        </p>
        <ul className="grid list-disc gap-1 pl-5">
          <li>High scores and personal records for each game mode</li>
          <li>Experience points, level, and unlocked achievements</li>
          <li>Gameplay statistics such as games played and average reaction time</li>
          <li>Daily challenge progress and streaks</li>
          <li>Unlocked themes and your selected theme</li>
          <li>Your sound, vibration, and reduced-motion settings</li>
        </ul>
        <p>
          You can permanently delete all of it at any time from{" "}
          <span className="text-arcade-text">Settings → Reset All Data</span>. Deleting the app also
          removes it.
        </p>
      </Section>

      <Section title="Third parties">
        <p>
          {APP_NAME} contains no advertising, no third-party analytics, and no third-party SDKs that
          collect data. Fonts and all other assets are bundled with the app rather than loaded from
          external servers.
        </p>
      </Section>

      <Section title="Children's privacy">
        <p>
          The game is suitable for all ages and collects no information from anyone, including
          children under 13.
        </p>
      </Section>

      <Section title="Sharing">
        <p>
          If you choose to share a score, the app hands text to your device&apos;s standard share
          sheet. What happens next is controlled by the app you pick and by that app&apos;s own
          privacy policy. We receive nothing.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          If this policy changes, the updated version will be posted at this URL with a new
          effective date.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about this policy:{" "}
          {supportEmailConfigured() ? (
            <a className="text-neon-green underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          ) : (
            <span className="text-arcade-text">
              use the address listed in the App Store listing
            </span>
          )}
          .
        </p>
      </Section>

      <p className="ui-body mt-10 text-[13px] text-arcade-muted/85">
        <Link className="underline" to="/support">
          Help &amp; Support
        </Link>{" "}
        ·{" "}
        <Link className="underline" to="/">
          Back to {APP_NAME}
        </Link>
      </p>
    </main>
  );
}
