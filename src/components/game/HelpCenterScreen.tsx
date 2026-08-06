import { useState } from "react";
import { APP_NAME, versionLabel } from "@/lib/appConfig";
import { Sheet } from "./Sheet";

interface HelpCenterScreenProps {
  open: boolean;
  onReplayOnboarding: () => void;
  onReplayTutorial: () => void;
  onOpenPractice: () => void;
  onOpenFeedback: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onClose: () => void;
}

interface Topic {
  id: string;
  title: string;
  body: string;
}

const TOPICS: Topic[] = [
  {
    id: "how",
    title: "How to play",
    body: "Targets appear one at a time. Tap the safe ones as fast as you can and leave the traps alone. A mistake costs a life, and the pace speeds up the longer you survive.",
  },
  {
    id: "targets",
    title: "Target meanings",
    body: "Green (labelled TAP) is a safe target. Red (labelled TRAP) must never be tapped — let it disappear. Gold (BONUS) is worth extra points. Purple (×2) must be double-tapped for a bigger reward. Every target is labelled, so colour is never the only signal.",
  },
  {
    id: "difficulty",
    title: "Difficulty levels",
    body: "Beginner gives you longer to react, Standard is the reference pace, and Expert speeds everything up. Each difficulty keeps its own best score for every mode.",
  },
  {
    id: "modes",
    title: "Modes",
    body: "Classic, Blitz, Survival and Focus are competitive. Zen and the Reflex Trainer are relaxed practice surfaces, and Practice Mode never records anything.",
  },
  {
    id: "xp",
    title: "XP and levels",
    body: "You earn XP for scores, perfect reactions, combo milestones, missions and challenges. XP raises your level, and levels unlock boards, titles and badges.",
  },
  {
    id: "missions",
    title: "Missions and challenges",
    body: "Daily Missions refresh each day and Weekly Challenges each week. Finished rewards must be claimed — nothing expires while it is waiting to be collected.",
  },
  {
    id: "achievements",
    title: "Achievements",
    body: "28 achievements track long-term milestones. Unlocked achievements hold an XP reward until you claim it on the Achievements screen.",
  },
  {
    id: "boards",
    title: "Boards",
    body: "Boards are the playfield environments. They unlock through levels, scores and achievements, and can be equipped from the Boards screen.",
  },
  {
    id: "cosmetics",
    title: "Titles and badges",
    body: "Titles and badges are earned from streaks, records and milestones. Equip them in the Collection hub; they appear on your profile and in shared results.",
  },
  {
    id: "progress",
    title: "Restoring local progress",
    body: "Progress lives on this device. Use Export Progress in About to make a JSON backup, and Import Progress on a new device or after a reinstall.",
  },
  {
    id: "audio",
    title: "Sound, music and haptics",
    body: "Sound effects, music and haptics each have their own switch in Settings and are remembered. Music only starts after your first tap, and pauses whenever the app goes to the background.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: "Settings includes Reduced Motion, High Contrast, Screen Shake, Board Effects, Skip Countdown and Kids Assist. Assisted runs are marked so they never mix with competitive records.",
  },
  {
    id: "trouble",
    title: "Troubleshooting",
    body: "If the game feels stuck, use Pause → Home and start a fresh run. If a screen looks wrong, close and reopen the app. Progress is saved after every run, so nothing is lost. If a problem persists, send a feedback report with the diagnostic details attached.",
  },
];

/** Help topics plus the entry points for replaying onboarding and tutorial. */
export function HelpCenterScreen({
  open,
  onReplayOnboarding,
  onReplayTutorial,
  onOpenPractice,
  onOpenFeedback,
  onOpenPrivacy,
  onOpenTerms,
  onClose,
}: HelpCenterScreenProps) {
  const [openId, setOpenId] = useState<string | null>("how");

  return (
    <Sheet open={open} title="Help & Support" onClose={onClose}>
      <div className="grid gap-2">
        <button
          type="button"
          onClick={onReplayTutorial}
          className="arcade-btn ui-title min-h-12 w-full bg-neon-green py-3 text-base text-arcade-bg-deep"
        >
          Replay the tutorial
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onReplayOnboarding}
            className="arcade-btn ui-title min-h-12 border border-arcade-line bg-arcade-surface py-3 text-[15px] text-arcade-text"
          >
            Replay intro
          </button>
          <button
            type="button"
            onClick={onOpenPractice}
            className="arcade-btn ui-title min-h-12 border border-arcade-line bg-arcade-surface py-3 text-[15px] text-arcade-text"
          >
            Practice Mode
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        {TOPICS.map((topic) => {
          const expanded = openId === topic.id;
          return (
            <div key={topic.id} className="rounded-2xl border border-arcade-line bg-arcade-surface">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpenId(expanded ? null : topic.id)}
                className="ui-title grid min-h-12 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left text-base text-arcade-text"
              >
                <span className="truncate">{topic.title}</span>
                <span aria-hidden className="text-arcade-muted">
                  {expanded ? "−" : "+"}
                </span>
              </button>
              {expanded && (
                <p className="ui-prose px-4 pb-4 text-[15px] text-arcade-muted">{topic.body}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-2">
        <button
          type="button"
          onClick={onOpenFeedback}
          className="arcade-btn ui-title min-h-12 w-full border border-arcade-line bg-arcade-surface py-3 text-base text-arcade-text"
        >
          Send feedback or report a bug
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="arcade-btn ui-title min-h-12 border border-arcade-line bg-arcade-surface py-3 text-[15px] text-arcade-text"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={onOpenTerms}
            className="arcade-btn ui-title min-h-12 border border-arcade-line bg-arcade-surface py-3 text-[15px] text-arcade-text"
          >
            Terms
          </button>
        </div>
      </div>

      <p className="ui-body-tight mt-6 text-[14px] text-arcade-muted">
        {APP_NAME} · Version {versionLabel()}
      </p>
    </Sheet>
  );
}
