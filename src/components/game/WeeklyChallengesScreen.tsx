import { CheckCircle2, CalendarDays } from "lucide-react";
import {
  WEEKLY_TIER_LABEL,
  weeklyRatio,
  type WeeklyChallenge,
  type WeeklyState,
} from "@/game/weeklyChallenges";
import { Sheet } from "./Sheet";
import { ArcButton, ChromeCard } from "./ArcUI";

const TIER_ACCENT: Record<WeeklyChallenge["tier"], string> = {
  accessible: "text-logo-green",
  medium: "text-neon-gold",
  challenging: "text-neon-purple",
};

function daysLeft(weekKey: string): number {
  const start = Date.parse(`${weekKey}T00:00:00`);
  if (!Number.isFinite(start)) return 7;
  const end = start + 7 * 86_400_000;
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}

interface WeeklyRowProps {
  challenge: WeeklyChallenge;
  reducedMotion: boolean;
  onClaim: (id: string) => void;
}

function WeeklyRow({ challenge, reducedMotion, onClaim }: WeeklyRowProps) {
  const pct = Math.round(weeklyRatio(challenge) * 100);
  return (
    <li>
      <ChromeCard faceClassName="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="ui-body-tight text-[15px] font-bold text-arcade-text">
              {challenge.title}
            </p>
            <p className="ui-body mt-1 text-[14px] text-arcade-muted">{challenge.description}</p>
          </div>
          <span
            className={`ui-title shrink-0 text-[10px] tracking-[0.18em] ${TIER_ACCENT[challenge.tier]}`}
          >
            {WEEKLY_TIER_LABEL[challenge.tier].toUpperCase()}
          </span>
        </div>

        <div
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-arcade-surface"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={`${challenge.title} progress`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-logo-green to-neon-gold"
            style={{
              width: `${pct}%`,
              transition: reducedMotion ? "none" : "width 400ms ease-out",
            }}
          />
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <span className="ui-body text-[14px] text-arcade-muted tabular-nums">
            {Math.min(Math.round(challenge.progress), challenge.target)} / {challenge.target}
          </span>
          <span className="ui-title text-[11px] tracking-[0.14em] text-arcade-muted">
            +{challenge.rewardXp} XP
          </span>
        </div>

        {challenge.completed && !challenge.claimed && (
          <ArcButton
            tone="green"
            className="mt-3"
            onClick={() => onClaim(challenge.id)}
            icon={<CheckCircle2 className="size-4" aria-hidden />}
          >
            Claim {challenge.rewardXp} XP
          </ArcButton>
        )}
        {challenge.completed && challenge.claimed && (
          <p className="ui-title mt-3 text-[11px] tracking-[0.16em] text-logo-green glow-green">
            ✓ REWARD CLAIMED
          </p>
        )}
      </ChromeCard>
    </li>
  );
}

interface WeeklyChallengesScreenProps {
  open: boolean;
  weekly: WeeklyState;
  reducedMotion: boolean;
  onClaim: (id: string) => void;
  onClose: () => void;
}

export function WeeklyChallengesScreen({
  open,
  weekly,
  reducedMotion,
  onClaim,
  onClose,
}: WeeklyChallengesScreenProps) {
  const completed = weekly.challenges.filter((c) => c.completed).length;
  const left = daysLeft(weekly.weekKey);

  return (
    <Sheet open={open} title="Weekly Challenges" onClose={onClose}>
      <p className="ui-title text-sm tracking-[0.16em] text-neon-gold glow-gold">
        {completed} / {weekly.challenges.length} COMPLETE THIS WEEK
      </p>
      <p className="ui-body mt-1.5 text-[15px] text-arcade-muted">
        {left === 0
          ? "New challenges arrive at midnight."
          : `Resets in ${left} day${left === 1 ? "" : "s"}. Progress carries across every run.`}
      </p>

      <ul className="mt-4 grid gap-3">
        {weekly.challenges.map((c) => (
          <WeeklyRow key={c.id} challenge={c} reducedMotion={reducedMotion} onClaim={onClaim} />
        ))}
      </ul>

      <p className="ui-body mt-5 text-[14px] text-arcade-muted">
        Lifetime weekly challenges completed: {weekly.lifetimeCompleted}
      </p>
    </Sheet>
  );
}

interface WeeklyCardProps {
  weekly: WeeklyState;
  claimable: number;
  reducedMotion: boolean;
  onOpen: () => void;
}

/** Compact home-screen summary of the weekly set. */
export function WeeklyChallengesCard({
  weekly,
  claimable,
  reducedMotion,
  onOpen,
}: WeeklyCardProps) {
  const list = weekly.challenges;
  const completed = list.filter((c) => c.completed).length;
  const next = list.find((c) => !c.completed) ?? list[0];
  const pct = next ? Math.round(weeklyRatio(next) * 100) : 100;

  return (
    <button type="button" onClick={onOpen} className="btn-arc chrome-card w-full text-left">
      <span className="chrome-face block px-4 py-3">
        <span className="flex items-center justify-between gap-3">
          <span className="ui-title flex items-center gap-2 text-[10px] tracking-[0.24em] text-neon-purple">
            <CalendarDays className="size-4" aria-hidden /> WEEKLY CHALLENGES
          </span>
          <span className="ui-title text-[10px] tracking-[0.18em] text-arcade-muted">
            {completed}/{list.length}
          </span>
        </span>
        {next && (
          <>
            <span className="ui-body-tight mt-2 block text-[15px] font-bold text-arcade-text">
              {next.title}
            </span>
            <span className="mt-2.5 block h-2 overflow-hidden rounded-full bg-arcade-surface">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-gold"
                style={{
                  width: `${pct}%`,
                  transition: reducedMotion ? "none" : "width 400ms ease-out",
                }}
              />
            </span>
          </>
        )}
        {claimable > 0 && (
          <span className="ui-title mt-2.5 block text-[11px] tracking-[0.16em] text-logo-green glow-green">
            {claimable} REWARD{claimable > 1 ? "S" : ""} READY TO CLAIM
          </span>
        )}
      </span>
    </button>
  );
}
