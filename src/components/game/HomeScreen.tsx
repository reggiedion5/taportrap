import {
  BarChart3,
  Bell,
  ChevronRight,
  Flame,
  HelpCircle,
  Medal,
  Palette,
  Settings2,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";
import type { DailyChallenge, DailyState, PlayerLevel } from "@/game/progressionTypes";
import type { DailyMissionsState } from "@/game/dailyMissions";
import { DIFFICULTIES, DIFFICULTY_PRESETS, type Difficulty } from "@/game/difficulty";
import logoAsset from "@/assets/tap-or-trap-logo.png.asset.json";
import { ArcadeBackdrop } from "./ArcadeBackdrop";
import { DailyChallengeCard } from "./DailyChallengeCard";
import { DailyMissionsCard } from "./DailyMissionsScreen";
import { WeeklyChallengesCard } from "./WeeklyChallengesScreen";
import type { WeeklyState } from "@/game/phase3Types";
import { XpProgressBar } from "./XpProgressBar";
import { ArcButton, ChromeBadge, ChromeCard } from "./ArcUI";

interface HomeScreenProps {
  level: PlayerLevel;
  modeName: string;
  modeTagline: string;
  modeBestLabel: string;
  isTrainingMode: boolean;
  difficulty: Difficulty;
  difficultyBests: Record<Difficulty, number>;
  onDifficultyChange: (difficulty: Difficulty) => void;
  daily: DailyState;
  challenge: DailyChallenge;
  missions: DailyMissionsState;
  claimableMissions: number;
  claimableAchievements: number;
  boardHint: string | null;
  boardsUnlocked: number;
  boardsTotal: number;
  newBoardCount: number;
  reducedMotion: boolean;
  onPlay: () => void;
  onOpenModes: () => void;
  onOpenAchievements: () => void;
  onOpenMissions: () => void;
  onOpenStatistics: () => void;
  onOpenBoards: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
  achievementsUnlocked: number;
  achievementsTotal: number;
  /* phase 3 */
  weekly: WeeklyState;
  claimableWeekly: number;
  playStreak: number;
  playerTitle: string;
  unreadNotifications: number;
  loginAvailable: boolean;
  onOpenWeekly: () => void;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  onOpenLeaderboard: () => void;
  onOpenCollection: () => void;
}


export function HomeScreen({
  level,
  modeName,
  modeTagline,
  modeBestLabel,
  isTrainingMode,
  difficulty,
  difficultyBests,
  onDifficultyChange,
  daily,
  challenge,
  missions,
  claimableMissions,
  claimableAchievements,
  boardHint,
  boardsUnlocked,
  boardsTotal,
  newBoardCount,
  reducedMotion,
  onPlay,
  onOpenModes,
  onOpenAchievements,
  onOpenMissions,
  onOpenStatistics,
  onOpenBoards,
  onOpenSettings,
  onOpenHowToPlay,
  achievementsUnlocked,
  achievementsTotal,
  weekly,
  claimableWeekly,
  playStreak,
  playerTitle,
  unreadNotifications,
  loginAvailable,
  onOpenWeekly,
  onOpenProfile,
  onOpenNotifications,
  onOpenLeaderboard,
  onOpenCollection,
}: HomeScreenProps) {

  return (
    <div className="no-select relative min-h-[100dvh] overflow-hidden">
      <ArcadeBackdrop />
      <div className="safe-area animate-screen-in relative mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-5 py-5">
        {/* ---- top ---- */}
        <header className="flex items-center justify-between gap-3">
          <button type="button" onClick={onOpenProfile} className="btn-arc text-left">
            <ChromeBadge>
              <span className="score-digits text-sm">L{level.level}</span>
              <span className="ui-title flex items-center gap-1 text-[11px] tracking-[0.18em] text-neon-gold">
                <Flame className="size-3.5" aria-hidden />
                {playStreak}
              </span>
              <span className="ui-title max-w-[92px] truncate text-[11px] tracking-[0.14em] text-arcade-muted">
                {playerTitle}
              </span>
            </ChromeBadge>
          </button>
          <div className="flex items-center gap-2">
          <ArcButton
            aria-label={
              unreadNotifications > 0
                ? `Open notifications, ${unreadNotifications} unread`
                : "Open notifications"
            }
            onClick={onOpenNotifications}
            className="relative w-auto"
            faceClassName="size-11 min-h-11 !px-0"
            icon={<Bell className="icon-chrome size-5" />}
          >
            <span className="sr-only">Notifications</span>
            {unreadNotifications > 0 && (
              <span className="ui-title absolute -right-1 -top-1 z-20 min-w-5 rounded-full bg-logo-green px-1.5 py-0.5 text-center text-[10px] text-arcade-bg-deep">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </ArcButton>
          <ArcButton
            aria-label="Open settings"
            onClick={onOpenSettings}
            className="w-auto"
            faceClassName="size-11 min-h-11 !px-0"
            icon={<Settings2 className="icon-chrome size-5" />}
          >
            <span className="sr-only">Settings</span>
          </ArcButton>
          </div>
        </header>

        {/* ---- logo ---- */}
        <div className="relative mt-2 grid place-items-center">
          <div className="pointer-events-none absolute size-[78%] rounded-full bg-logo-green/10 blur-3xl" />
          <img
            src={logoAsset.url}
            alt="Tap or Trap! — tap fast, think faster"
            width={1024}
            height={1024}
            className={`relative w-[min(84vw,340px)] [mask-image:radial-gradient(circle_at_center,black_58%,transparent_76%)] drop-shadow-[0_24px_50px_oklch(0_0_0_/_0.7)] ${
              reducedMotion ? "" : "animate-float-soft"
            }`}
          />
        </div>

        {/* ---- progression ---- */}
        <ChromeCard className="mt-1" faceClassName="px-4 py-3">
          <XpProgressBar
            level={level.level}
            currentXp={level.currentXp}
            xpForNext={level.xpForNext}
            reducedMotion={reducedMotion}
            compact
          />
        </ChromeCard>

        {/* ---- mode + best ---- */}
        <button
          type="button"
          onClick={onOpenModes}
          className="chrome-card btn-arc mt-3 w-full text-left"
        >
          <span className="chrome-face block px-4 py-3">
            <span className="ui-title block text-[10px] tracking-[0.24em] text-arcade-muted">
              {isTrainingMode ? "TRAINING" : "MODE"}
            </span>
            <span className="mt-1 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3">
              <span
                className={`ui-title min-w-0 truncate text-lg ${
                  isTrainingMode ? "text-neon-purple" : "text-logo-green"
                }`}
              >
                {modeName}
              </span>
              <span className="score-digits shrink-0 text-sm tracking-[0.14em]">
                {modeBestLabel}
              </span>
              <ChevronRight className="icon-chrome size-5 shrink-0" aria-hidden />
            </span>
            <span className="ui-body-tight mt-2 block text-[15px] text-arcade-muted">
              {modeTagline}
            </span>
          </span>
        </button>

        {/* ---- difficulty ---- */}
        {!isTrainingMode && (
          <DifficultySwitch value={difficulty} bests={difficultyBests} onChange={onDifficultyChange} />
        )}

        {/* ---- play ---- */}
        <ArcButton
          tone="green"
          size="lg"
          onClick={onPlay}
          className={`mt-4 ${reducedMotion ? "" : "animate-glow-pulse"}`}
          faceClassName="text-3xl tracking-tight"
          icon={<Zap className="size-7 fill-current" aria-hidden />}
        >
          PLAY
        </ArcButton>

        {/* ---- lower ---- */}
        <div className="mt-4 grid gap-3 pb-4">
          <DailyMissionsCard
            missions={missions}
            claimable={claimableMissions}
            reducedMotion={reducedMotion}
            onOpen={onOpenMissions}
          />

          <WeeklyChallengesCard
            weekly={weekly}
            claimable={claimableWeekly}
            reducedMotion={reducedMotion}
            onOpen={onOpenWeekly}
          />

          <DailyChallengeCard challenge={challenge} daily={daily} reducedMotion={reducedMotion} />

          <div className="grid grid-cols-2 gap-2.5">
            <NavTile
              icon={<Trophy className="icon-chrome size-4" aria-hidden />}
              label="Achievements"
              sub={
                claimableAchievements > 0
                  ? `${claimableAchievements} reward${claimableAchievements > 1 ? "s" : ""} ready`
                  : `${achievementsUnlocked}/${achievementsTotal}`
              }
              onClick={onOpenAchievements}
            />

            <NavTile
              icon={<BarChart3 className="icon-chrome size-4" aria-hidden />}
              label="Statistics"
              sub="Lifetime data"
              onClick={onOpenStatistics}
            />
            <NavTile
              icon={<Palette className="icon-chrome size-4" aria-hidden />}
              label={newBoardCount > 0 ? `Boards · ${newBoardCount} NEW` : "Boards"}
              sub={boardHint ?? `${boardsUnlocked}/${boardsTotal} unlocked`}
              onClick={onOpenBoards}
            />
            <NavTile
              icon={<UserRound className="icon-chrome size-4" aria-hidden />}
              label="Profile"
              sub={loginAvailable ? "Login reward ready" : `${playStreak}-day streak`}
              onClick={onOpenProfile}
            />
            <NavTile
              icon={<Medal className="icon-chrome size-4" aria-hidden />}
              label="Collection"
              sub="Titles & badges"
              onClick={onOpenCollection}
            />
            <NavTile
              icon={<Trophy className="icon-chrome size-4" aria-hidden />}
              label="Records"
              sub="Your best runs"
              onClick={onOpenLeaderboard}
            />
            <NavTile
              icon={<HelpCircle className="icon-chrome size-4" aria-hidden />}
              label="How to Play"
              sub="Rules & tutorial"
              onClick={onOpenHowToPlay}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DifficultySwitch({
  value,
  bests,
  onChange,
}: {
  value: Difficulty;
  bests: Record<Difficulty, number>;
  onChange: (difficulty: Difficulty) => void;
}) {
  const active = DIFFICULTY_PRESETS[value] ?? DIFFICULTY_PRESETS.standard;
  return (
    <div className="mt-2.5">
      <div className="chrome-card">
        <div className="chrome-face px-3 py-3">
          <span className="ui-title block text-[10px] tracking-[0.24em] text-arcade-muted">
            DIFFICULTY
          </span>
          <div
            role="radiogroup"
            aria-label="Difficulty"
            className="mt-2 grid grid-cols-3 gap-2"
          >
            {DIFFICULTIES.map((id) => {
              const preset = DIFFICULTY_PRESETS[id];
              const isActive = id === value;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => onChange(id)}
                  className={`btn-arc no-select rounded-xl ${isActive ? "" : "opacity-70"}`}
                >
                  <span
                    className={`btn-arc-face ui-title min-h-11 justify-center px-2 text-[13px] ${
                      isActive ? "btn-green" : "btn-steel"
                    }`}
                  >
                    <span className="btn-gloss" aria-hidden />
                    <span className="relative z-10 flex flex-col items-center leading-tight">
                      <span className="truncate">{preset.label}</span>
                      <span className="text-[10px] tracking-[0.12em] opacity-80">
                        BEST {bests[id] ?? 0}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="ui-body-tight mt-2 text-[14px] text-arcade-muted">{active.blurb}</p>
        </div>
      </div>
    </div>
  );
}

function NavTile({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="btn-arc chrome-card text-left">
      <span className="chrome-face flex min-h-16 flex-col justify-center gap-1 px-3.5 py-2.5">
        <span className="flex items-center gap-2">
          <span className="shrink-0">{icon}</span>
          <span className="ui-title min-w-0 truncate text-base text-arcade-text">{label}</span>
        </span>
        <span className="ui-body-tight text-[13.5px] text-arcade-muted">{sub}</span>
      </span>
    </button>
  );
}
