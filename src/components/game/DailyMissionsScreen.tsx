import { CheckCircle2, Target as TargetIcon } from "lucide-react";
import {
  MISSION_TIER_LABEL,
  missionRatio,
  type DailyMission,
  type DailyMissionsState,
} from "@/game/dailyMissions";
import { Sheet } from "./Sheet";
import { ArcButton, ChromeCard } from "./ArcUI";

const TIER_ACCENT: Record<DailyMission["tier"], string> = {
  easy: "text-logo-green",
  medium: "text-neon-gold",
  hard: "text-neon-purple",
};

function progressLabel(mission: DailyMission, value: number): string {
  if (mission.lowerIsBetter) {
    return value > 0
      ? `${Math.round(value)}ms best · target ${mission.target}ms`
      : `No qualifying run yet · target ${mission.target}ms`;
  }
  return `${Math.round(Math.min(value, mission.target))} / ${mission.target}`;
}

interface MissionRowProps {
  mission: DailyMission;
  value: number;
  completed: boolean;
  claimed: boolean;
  reducedMotion: boolean;
  onClaim: (id: string) => void;
}

export function MissionRow({
  mission,
  value,
  completed,
  claimed,
  reducedMotion,
  onClaim,
}: MissionRowProps) {
  const pct = Math.round(missionRatio(mission, value) * 100);
  return (
    <li>
      <ChromeCard faceClassName="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="ui-body-tight min-w-0 text-[15px] font-bold text-arcade-text">
            {mission.label}
          </p>
          <span
            className={`ui-title shrink-0 text-[10px] tracking-[0.18em] ${TIER_ACCENT[mission.tier]}`}
          >
            {MISSION_TIER_LABEL[mission.tier].toUpperCase()}
          </span>
        </div>

        <div
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-arcade-surface"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={`${mission.label} progress`}
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
            {completed ? "Completed" : progressLabel(mission, value)}
          </span>
          <span className="ui-title text-[11px] tracking-[0.14em] text-arcade-muted">
            +{mission.rewardXp} XP
          </span>
        </div>

        {completed && !claimed && (
          <ArcButton
            tone="green"
            className="mt-3"
            onClick={() => onClaim(mission.id)}
            icon={<CheckCircle2 className="size-4" aria-hidden />}
          >
            Claim {mission.rewardXp} XP
          </ArcButton>
        )}
        {completed && claimed && (
          <p className="ui-title mt-3 text-[11px] tracking-[0.16em] text-logo-green glow-green">
            ✓ REWARD CLAIMED
          </p>
        )}
      </ChromeCard>
    </li>
  );
}

interface DailyMissionsScreenProps {
  open: boolean;
  missions: DailyMissionsState;
  reducedMotion: boolean;
  onClaim: (id: string) => void;
  onClose: () => void;
}

export function DailyMissionsScreen({
  open,
  missions,
  reducedMotion,
  onClaim,
  onClose,
}: DailyMissionsScreenProps) {
  const completed = missions.missions.filter((m) => missions.progress[m.id]?.completed).length;

  return (
    <Sheet open={open} title="Daily Missions" onClose={onClose}>
      <p className="ui-title text-sm tracking-[0.16em] text-neon-gold glow-gold">
        {completed} / {missions.missions.length} COMPLETE TODAY
      </p>
      <p className="ui-body mt-1.5 text-[15px] text-arcade-muted">
        Fresh missions arrive every day at midnight. Claim rewards before they reset.
      </p>

      <ul className="mt-4 grid gap-3">
        {missions.missions.map((m) => {
          const p = missions.progress[m.id] ?? { value: 0, completed: false, claimed: false };
          return (
            <MissionRow
              key={m.id}
              mission={m}
              value={p.value}
              completed={p.completed}
              claimed={p.claimed}
              reducedMotion={reducedMotion}
              onClaim={onClaim}
            />
          );
        })}
      </ul>

      <p className="ui-body mt-5 text-[14px] text-arcade-muted">
        Lifetime missions completed: {missions.lifetimeCompleted}
      </p>
    </Sheet>
  );
}

interface DailyMissionsCardProps {
  missions: DailyMissionsState;
  claimable: number;
  reducedMotion: boolean;
  onOpen: () => void;
}

/** Compact home-screen summary. Never blocks the Play button. */
export function DailyMissionsCard({
  missions,
  claimable,
  reducedMotion,
  onOpen,
}: DailyMissionsCardProps) {
  const list = missions.missions;
  const completed = list.filter((m) => missions.progress[m.id]?.completed).length;
  const next = list.find((m) => !missions.progress[m.id]?.completed) ?? list[0];
  const value = next ? (missions.progress[next.id]?.value ?? 0) : 0;
  const pct = next ? Math.round(missionRatio(next, value) * 100) : 100;

  return (
    <button type="button" onClick={onOpen} className="btn-arc chrome-card w-full text-left">
      <span className="chrome-face block px-4 py-3">
        <span className="flex items-center justify-between gap-3">
          <span className="ui-title flex items-center gap-2 text-[10px] tracking-[0.24em] text-neon-gold">
            <TargetIcon className="size-4" aria-hidden /> DAILY MISSIONS
          </span>
          <span className="ui-title text-[10px] tracking-[0.18em] text-arcade-muted">
            {completed}/{list.length}
          </span>
        </span>
        {next && (
          <>
            <span className="ui-body-tight mt-2 block text-[15px] font-bold text-arcade-text">
              {next.label}
            </span>
            <span className="mt-2.5 block h-2 overflow-hidden rounded-full bg-arcade-surface">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-logo-green to-neon-gold"
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
