import { APP_NAME } from "@/lib/appConfig";
import { Sheet } from "./Sheet";

interface TermsScreenProps {
  open: boolean;
  onOpenPrivacy: () => void;
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <h3 className="sticker-sm text-[13px] tracking-[0.16em] text-arcade-text/90">{title}</h3>
      <p className="ui-prose mt-2 text-[15px] text-arcade-text/95">{children}</p>
    </section>
  );
}

/** Draft terms — must be reviewed by the publisher before submission. */
export function TermsScreen({ open, onOpenPrivacy, onClose }: TermsScreenProps) {
  return (
    <Sheet open={open} title="Terms of Use" onClose={onClose}>
      <p className="ui-body rounded-xl border border-neon-gold/50 bg-neon-gold/10 p-3 text-[14px] text-neon-gold">
        Draft text. Review and complete this before submitting to the App Store or Google Play.
      </p>

      <Section title="THE GAME">
        {APP_NAME} is a single-player reaction game provided as-is for personal entertainment. There
        are no accounts, purchases, subscriptions or advertising in this version.
      </Section>

      <Section title="YOUR PROGRESS">
        Progress is stored only on your device. Deleting the app, clearing its storage or resetting
        progress removes it permanently. Export a backup first if you want to keep it.
      </Section>

      <Section title="ACCEPTABLE USE">
        Do not modify, tamper with or automate the game in order to fabricate scores, and do not
        redistribute the app or its assets.
      </Section>

      <Section title="NO WARRANTY">
        The game is provided without warranty of any kind. It is a casual game and is not intended
        for medical, diagnostic, training or safety-critical use.
      </Section>

      <Section title="CHANGES">
        These terms may change with future updates. Continuing to play after an update means you
        accept the current terms.
      </Section>

      <Section title="CONTACT">
        Support and contact details are shown in Help &amp; Support when they are configured for
        this build.
      </Section>

      <button
        type="button"
        onClick={onOpenPrivacy}
        className="arcade-btn ui-title mt-7 min-h-12 w-full border border-arcade-line bg-arcade-surface py-3 text-base text-arcade-text"
      >
        Read the Privacy section
      </button>
    </Sheet>
  );
}
