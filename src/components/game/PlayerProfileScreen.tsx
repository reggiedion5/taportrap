import { useMemo } from "react";
import { BarChart3, Flame, Gift, Trophy, Users } from "lucide-react";
import { boardById } from "@/game/boards";
import { DIFFICULTY_PRESETS } from "@/game/difficulty";
import { LOGIN_CYCLE, currentLoginDay } from "@/game/loginRewards";
import { STREAK_MILESTONES } from "@/game/playStreak";
import {
  BADGE_TIER_LABEL,
  requirementProgress,
  titleById,
  type CosmeticContext,
} from "@/game/cosmetics";
import { badgeById } from "@/game/cosmetics";
import type { LoginRewardState, Phase3State } from "@/game/phase3Types";
import type { PlayerLevel } from "@/game/progressionTypes";
import { Sheet } from "./Sheet";
import { ArcButton, ChromeCard } from "./ArcUI";
import { XpProgressBar } from "./XpProgressBar";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <ChromeCard faceClassName="px-3 py-2.5">
      <p className="ui-title text-[10px] tracking-[0.2em] text-arcade-muted">{label}</p>
      <p className="ui-body-tight mt-1 text-[17px] font-bold text-arcade-text tabular-nums">
        {value}
      </p>
    </ChromeCard>
  );
}

function nextMilestone(current: number): number | null {
  return STREAK_MILESTONES.find((m) => m.days > current)?.days ?? null;
}

interface PlayerProfileScreenProps {
  open: boolean;
  phase3: Phase3State;
  level: PlayerLevel;
  lifetimeXp: number;
  gamesPlayed: number;
  achievementsUnlocked: number;
  achievementsTotal: number;
  boardsUnlocked: number;
  boardsTotal: number;
  playStreak: number;
  loginAvailable: boolean;
  cosmetics: CosmeticContext;
  favorites: { difficulty: string | null; boardId: string | null };
  reducedMotion: boolean;
  onClaimLogin: () => void;
  onOpenStatistics: () => void;
  onOpenCollection: () => void;
  onOpenLeaderboard: () => void;
  onClose: () => void;
}

/** Player identity: level, title, badge, streak, login rewards and shortcuts. */
export function PlayerProfileScreen({
  open,
  phase3,
  level,
  lifetimeXp,
  gamesPlayed,
  achievementsUnlocked,
  achievementsTotal,
  boardsUnlocked,
  boardsTotal,
  playStreak,
  loginAvailable,
  cosmetics,
  favorites,
  reducedMotion,
  onClaimLogin,
  onOpenStatistics,
  onOpenCollection,
  onOpenLeaderboard,
  onClose,
}: PlayerProfileScreenProps) {
  const title = titleById(phase3.equippedTitleId);
  const badge = badgeById(phase3.equippedBadgeId ?? "");
  const loginDay = currentLoginDay(phase3.login as LoginRewardState);
  const milestone = nextMilestone(playStreak);

  const nextTitle = useMemo(() => {
    const locked = ["quick-hands", "hot-streak", "combo-king", "veteran", "legend"]
      .map((id) => titleById(id))
      .filter((t) => !phase3.unlockedTitleIds.includes(t.id));
    return locked[0] ?? null;
  }, [phase3.unlockedTitleIds]);

  return (
    <Sheet open={open} title="Player Profile" onClose={onClose}>
      <ChromeCard faceClassName="p-4 text-center">
        <p className="ui-title text-[11px] tracking-[0.26em] text-neon-gold glow-gold">
          {title.name}
        </p>
        <p className="ui-body-tight mt-1 text-[26px] font-black text-arcade-text">
          LEVEL {level.level}
        </p>
        {badge && (
          <p className="ui-body mt-1 text-[14px] text-arcade-muted">
            {BADGE_TIER_LABEL[badge.tier]} badge · {badge.name}
          </p>
        )}
        <div className="mt-3">
          <XpProgressBar
            level={level.level}
            currentXp={level.currentXp}
            xpForNext={level.xpForNext}
            reducedMotion={reducedMotion}
            compact
          />
        </div>
      </ChromeCard>

      <section className="mt-5" aria-label="Play streak">
        <h3 className="sticker-sm text-[11px] tracking-[0.26em] text-arcade-text/80">
          PLAY STREAK
        </h3>
        <ChromeCard faceClassName="mt-3 p-4">
          <p className="ui-body-tight flex items-center gap-2 text-[20px] font-black text-arcade-text">
            <Flame className="size-5 text-neon-gold" aria-hidden />
            {playStreak} day{playStreak === 1 ? "" : "s"}
          </p>
          <p className="ui-body mt-1 text-[14px] text-arcade-muted">
            Longest {phase3.streak.longest} · {phase3.streak.uniquePlayDates} days played in total.
            {milestone ? ` Next reward at ${milestone} days.` : " Every milestone reached."}
          </p>
        </ChromeCard>
      </section>

      <section className="mt-5" aria-label="Daily login reward">
        <h3 className="sticker-sm text-[11px] tracking-[0.26em] text-arcade-text/80">
          DAILY LOGIN
        </h3>
        <ChromeCard faceClassName="mt-3 p-4">
          <div className="flex gap-1.5" aria-hidden>
            {LOGIN_CYCLE.map((day) => (
              <span
                key={day.day}
                className={`ui-title flex-1 rounded-md py-1.5 text-center text-[10px] tracking-[0.1em] ${
                  day.day < loginDay.day
                    ? "bg-logo-green/25 text-logo-green"
                    : day.day === loginDay.day
                      ? "bg-neon-gold/25 text-neon-gold"
                      : "bg-arcade-surface text-arcade-muted"
                }`}
              >
                D{day.day}
              </span>
            ))}
          </div>
          <p className="ui-body mt-2.5 text-[14px] text-arcade-muted">
            Day {loginDay.day} of {LOGIN_CYCLE.length} · +{loginDay.xp} XP
            {loginDay.badgeId ? " + badge" : ""}
          </p>
          {loginAvailable ? (
            <ArcButton
              tone="green"
              className="mt-3"
              onClick={onClaimLogin}
              icon={<Gift className="size-4" aria-hidden />}
            >
              Claim today&apos;s reward
            </ArcButton>
          ) : (
            <p className="ui-title mt-3 text-[11px] tracking-[0.16em] text-logo-green glow-green">
              ✓ CLAIMED TODAY — COME BACK TOMORROW
            </p>
          )}
        </ChromeCard>
      </section>

      <section className="mt-5" aria-label="Career summary">
        <h3 className="sticker-sm text-[11px] tracking-[0.26em] text-arcade-text/80">CAREER</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Stat label="GAMES PLAYED" value={String(gamesPlayed)} />
          <Stat label="LIFETIME XP" value={String(lifetimeXp)} />
          <Stat label="ACHIEVEMENTS" value={`${achievementsUnlocked}/${achievementsTotal}`} />
          <Stat label="BOARDS" value={`${boardsUnlocked}/${boardsTotal}`} />
          <Stat label="TITLES" value={`${phase3.unlockedTitleIds.length}`} />
          <Stat label="BADGES" value={`${phase3.unlockedBadgeIds.length}`} />
          <Stat
            label="FAVOURITE PACE"
            value={
              favorites.difficulty
                ? (DIFFICULTY_PRESETS[favorites.difficulty as "standard"]?.label ??
                  favorites.difficulty)
                : "—"
            }
          />
          <Stat
            label="MOST PLAYED BOARD"
            value={favorites.boardId ? boardById(favorites.boardId).name : "—"}
          />
        </div>
      </section>

      {nextTitle && (
        <section className="mt-5" aria-label="Next title">
          <h3 className="sticker-sm text-[11px] tracking-[0.26em] text-arcade-text/80">
            NEXT TITLE
          </h3>
          <ChromeCard faceClassName="mt-3 p-4">
            <p className="ui-body-tight text-[15px] font-bold text-arcade-text">{nextTitle.name}</p>
            <p className="ui-body mt-1 text-[14px] text-arcade-muted">
              {nextTitle.description}{" "}
              {(() => {
                const p = requirementProgress(nextTitle.requirement, cosmetics);
                return `${Math.min(p.value, p.target)} / ${p.target}`;
              })()}
            </p>
          </ChromeCard>
        </section>
      )}

      <div className="mt-6 grid gap-2.5">
        <ArcButton onClick={onOpenCollection} icon={<Users className="size-4" aria-hidden />}>
          Collection
        </ArcButton>
        <ArcButton onClick={onOpenStatistics} icon={<BarChart3 className="size-4" aria-hidden />}>
          Statistics
        </ArcButton>
        <ArcButton onClick={onOpenLeaderboard} icon={<Trophy className="size-4" aria-hidden />}>
          Your local records
        </ArcButton>
      </div>
    </Sheet>
  );
}
