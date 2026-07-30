import { BarChart3, ChevronRight, HelpCircle, Palette, Settings2, Trophy, X } from "lucide-react";
import type { GameModeConfig } from "@/game/modes";
import type { DailyChallenge, DailyState, PlayerLevel } from "@/game/progressionTypes";
import { ArcadeBackdrop } from "./ArcadeBackdrop";
import { DailyChallengeCard } from "./DailyChallengeCard";
import { XpProgressBar } from "./XpProgressBar";

interface HomeScreenProps {
  level: PlayerLevel;
  modeConfig: GameModeConfig;
  modeHighScore: number;
  daily: DailyState;
  challenge: DailyChallenge;
  reminder: string | null;
  reducedMotion: boolean;
  onPlay: () => void;
  onOpenModes: () => void;
  onOpenAchievements: () => void;
  onOpenStatistics: () => void;
  onOpenThemes: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
  onDismissReminder: () => void;
  achievementsUnlocked: number;
  achievementsTotal: number;
}

export function HomeScreen({
  level,
  modeConfig,
  modeHighScore,
  daily,
  challenge,
  reminder,
  reducedMotion,
  onPlay,
  onOpenModes,
  onOpenAchievements,
  onOpenStatistics,
  onOpenThemes,
  onOpenSettings,
  onOpenHowToPlay,
  onDismissReminder,
  achievementsUnlocked,
  achievementsTotal,
}: HomeScreenProps) {
  return (
    <div className="no-select relative min-h-[100dvh] overflow-hidden">
      <ArcadeBackdrop />
      <div className="safe-area relative mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-5 py-6">
        {/* ---- top ---- */}
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <span className="sticker-sm grid h-11 min-w-11 place-items-center rounded-full border border-neon-gold bg-arcade-surface px-3 text-sm text-neon-gold glow-gold">
            L{level.level}
          </span>
          <p className="sticker-sm truncate text-center text-[11px] tracking-[0.3em] text-arcade-text/80">
            REACTION ARCADE
          </p>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            className="arcade-btn grid size-11 shrink-0 place-items-center border border-arcade-line bg-arcade-surface text-arcade-text"
          >
            <Settings2 className="size-5" />
          </button>
        </header>

        <div className="mt-6">
          <h1 className="sticker-text flex flex-wrap items-end gap-x-3 text-[clamp(42px,13vw,68px)] leading-[0.88]">
            <span className="text-neon-green glow-green">Tap</span>
            <span className="text-[0.55em] text-arcade-text glow-white">or</span>
            <span className="text-neon-red glow-red">Trap</span>
          </h1>
          <p className="mt-2 text-lg font-black tracking-tight text-arcade-text">
            Tap fast. Think faster.
          </p>
        </div>

        <div className="arcade-panel mt-4 p-4">
          <XpProgressBar
            level={level.level}
            currentXp={level.currentXp}
            xpForNext={level.xpForNext}
            reducedMotion={reducedMotion}
            compact
          />
          <p className="sticker-sm mt-3 text-[11px] tracking-[0.16em] text-arcade-text/80">
            STREAK {daily.currentStreak} · BEST {daily.bestStreak} · TROPHIES {achievementsUnlocked}
            /{achievementsTotal}
          </p>
        </div>

        {reminder && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-neon-gold/60 bg-arcade-surface px-4 py-3">
            <p className="min-w-0 flex-1 text-sm font-bold text-arcade-text">{reminder}</p>
            <button
              type="button"
              onClick={onDismissReminder}
              aria-label="Dismiss reminder"
              className="arcade-btn grid size-9 shrink-0 place-items-center rounded-full border border-arcade-line text-arcade-text"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* ---- center ---- */}
        <div className="mt-5">
          <button
            type="button"
            onClick={onOpenModes}
            className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-arcade-line bg-arcade-surface px-5 py-4 text-left"
          >
            <span className="min-w-0">
              <span className="sticker-sm block text-[10px] tracking-[0.24em] text-arcade-text/75">
                MODE
              </span>
              <span className="sticker-sm block truncate text-lg text-neon-green glow-green">
                {modeConfig.name}
              </span>
              <span className="block truncate text-xs font-semibold text-arcade-text/80">
                {modeConfig.tagline}
              </span>
            </span>
            <ChevronRight className="size-5 text-arcade-text" aria-hidden />
          </button>

          <div className="mt-3 flex items-center justify-between rounded-2xl border border-arcade-line bg-arcade-surface px-5 py-4">
            <span className="sticker-sm text-xs tracking-[0.22em] text-arcade-text/80">
              {modeConfig.name.toUpperCase()} BEST
            </span>
            <span className="sticker-sm text-3xl text-neon-gold glow-gold tabular-nums">
              {modeHighScore}
            </span>
          </div>

          <button
            type="button"
            onClick={onPlay}
            className="arcade-btn sticker-sm mt-4 w-full bg-neon-green py-6 text-3xl tracking-tight text-arcade-bg-deep shadow-[0_0_44px_-6px_var(--neon-green)]"
          >
            <span className={reducedMotion ? "" : "animate-wiggle"}>Play →</span>
          </button>
        </div>

        {/* ---- lower ---- */}
        <div className="mt-5 grid gap-3 pb-4">
          <DailyChallengeCard challenge={challenge} daily={daily} reducedMotion={reducedMotion} />

          <div className="grid grid-cols-2 gap-3">
            <NavTile
              icon={<Trophy className="size-5" aria-hidden />}
              label="Achievements"
              sub={`${achievementsUnlocked}/${achievementsTotal}`}
              onClick={onOpenAchievements}
            />
            <NavTile
              icon={<BarChart3 className="size-5" aria-hidden />}
              label="Statistics"
              sub="Lifetime data"
              onClick={onOpenStatistics}
            />
            <NavTile
              icon={<Palette className="size-5" aria-hidden />}
              label="Themes"
              sub="Unlock looks"
              onClick={onOpenThemes}
            />
            <NavTile
              icon={<HelpCircle className="size-5" aria-hidden />}
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
    <button
      type="button"
      onClick={onClick}
      className="arcade-btn flex min-h-[76px] flex-col justify-center gap-1 rounded-2xl border border-arcade-line bg-arcade-surface px-4 py-3 text-left text-arcade-text"
    >
      <span className="flex items-center gap-2">
        {icon}
        <span className="sticker-sm truncate text-sm tracking-tight">{label}</span>
      </span>
      <span className="truncate text-xs font-semibold text-arcade-text/80">{sub}</span>
    </button>
  );
}
