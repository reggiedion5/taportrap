import { Sheet } from "./Sheet";

const RULES = [
  {
    color: "bg-neon-green",
    text: "text-arcade-bg-deep",
    label: "TAP",
    title: "Green",
    tone: "text-neon-green glow-green",
    detail: "Smash it. +1 point.",
  },
  {
    color: "bg-neon-red",
    text: "text-arcade-text",
    label: "TRAP",
    title: "Red",
    tone: "text-neon-red glow-red",
    detail: "Hands off. Let it die. +1 point.",
  },
  {
    color: "bg-neon-gold",
    text: "text-arcade-bg-deep",
    label: "BONUS",
    title: "Gold",
    tone: "text-neon-gold glow-gold",
    detail: "Rare treasure. +3 points.",
  },
  {
    color: "bg-neon-purple",
    text: "text-arcade-text",
    label: "×2",
    title: "Purple",
    tone: "text-neon-purple glow-purple",
    detail: "Two taps, fast — or you're done.",
  },
];

interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
  onReplayTutorial: () => void;
}

export function HowToPlayModal({ open, onClose, onReplayTutorial }: HowToPlayModalProps) {
  return (
    <Sheet open={open} title="How to Play" onClose={onClose}>
      <div className="arcade-panel divide-y divide-arcade-line/50">
        {RULES.map((r) => (
          <div key={r.title} className="flex items-center gap-4 p-4">
            <span
              className={`grid size-14 shrink-0 place-items-center rounded-full ${r.color} ${r.text} text-[11px] font-black tracking-wider`}
            >
              {r.label}
            </span>
            <span className="min-w-0">
              <span className={`sticker-sm block text-base tracking-tight ${r.tone}`}>
                {r.title}
              </span>
              <span className="ui-body-tight mt-0.5 block text-[15px] text-arcade-muted">{r.detail}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="ui-body arcade-panel mt-4 space-y-3 p-5 text-[15px] text-arcade-text/95">
        <p>
          One target at a time. Nail them back to back and the combo stacks:{" "}
          <span className="text-neon-purple glow-purple">5 = ×2</span>,{" "}
          <span className="text-neon-purple glow-purple">10 = ×3</span>,{" "}
          <span className="text-neon-purple glow-purple">20 = ×4</span>.
        </p>
        <p>
          It gets nastier fast: 1.4s down to 0.65s. Under 250ms and you earn a{" "}
          <span className="text-neon-green glow-green">PERFECT!</span>
        </p>
        <p>
          Each mode changes the failure rules — Blitz burns clock, Survival costs lives, Focus
          removes traps entirely.
        </p>
      </div>

      <button
        type="button"
        onClick={onReplayTutorial}
        className="arcade-btn ui-title mt-5 min-h-12 w-full border border-arcade-line bg-arcade-surface py-4 text-base text-arcade-text"
      >
        Replay Tutorial
      </button>
    </Sheet>
  );
}
