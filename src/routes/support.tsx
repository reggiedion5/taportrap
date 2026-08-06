import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_NAME, PRIVACY_EFFECTIVE_DATE, SUPPORT_EMAIL, versionLabel } from "@/lib/appConfig";
import { supportEmailConfigured } from "@/lib/urlSafety";

const TITLE = "Support — Tap or Trap!";
const DESCRIPTION =
  "Help and contact for Tap or Trap! — the offline neon reaction arcade game. Troubleshooting for progress, sound, haptics and rotation.";

export const Route = createFileRoute("/support")({
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
  component: SupportPage,
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

function SupportPage() {
  return (
    <main className="safe-area mx-auto w-full max-w-2xl px-5 py-10">
      <p className="sticker-sm text-[12px] tracking-[0.14em] text-arcade-muted">{APP_NAME}</p>
      <h1 className="mt-2 text-3xl font-black text-arcade-text">Help &amp; Support</h1>
      <p className="mt-3 text-sm font-medium leading-relaxed text-arcade-text/80">
        {APP_NAME} is a single-player reaction game. Tap the green and gold targets, leave the red
        traps alone, and double-tap purple. It runs entirely on your device — there is no account,
        no sign-in and no internet connection required.
      </p>

      <Section title="Contact">
        <p>
          Email{" "}
          {supportEmailConfigured() ? (
            <a className="text-neon-green underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          ) : (
            <span className="text-arcade-text">the address listed in the App Store listing</span>
          )}{" "}
          and include your device model, iOS version and the app version shown in Settings → About.
          Current build: {versionLabel()}.
        </p>
      </Section>

      <Section title="My progress disappeared">
        <p>
          Scores, XP, achievements and themes are stored only on the device. Deleting the app,
          resetting the device, or using Settings → Reset All Data erases them permanently, and they
          cannot be recovered because nothing is ever uploaded.
        </p>
      </Section>

      <Section title="No sound">
        <p>
          Check the Sound toggle in Settings, then check the device volume and the physical silent
          switch. On iPhone the silent switch mutes game audio.
        </p>
      </Section>

      <Section title="No vibration">
        <p>
          Check the Vibration toggle in Settings and make sure System Haptics is enabled in the iOS
          Sounds &amp; Haptics settings. Some devices have no haptic engine.
        </p>
      </Section>

      <Section title="The game paused by itself">
        <p>
          A run pauses whenever the app is interrupted — a call, a notification pull-down, switching
          apps, or rotating the phone to landscape. Nothing is lost: tap Resume to carry on from
          where you stopped. Runs never resume on their own so you are never caught out.
        </p>
      </Section>

      <Section title="Motion makes me uncomfortable">
        <p>
          Turn on Reduced motion in Settings. Screen shake and the heavier animations are disabled
          while it is on.
        </p>
      </Section>

      <Section title="Privacy">
        <p>
          We collect nothing at all.{" "}
          <Link className="text-neon-green underline" to="/privacy">
            Read the privacy policy
          </Link>
          {PRIVACY_EFFECTIVE_DATE ? ` (effective ${PRIVACY_EFFECTIVE_DATE})` : ""}.
        </p>
      </Section>

      <p className="ui-body mt-10 text-[13px] text-arcade-muted/85">
        <Link className="underline" to="/">
          Back to {APP_NAME}
        </Link>
      </p>
    </main>
  );
}
