import { BarChart3, ChevronRight, HelpCircle, Palette, Settings2, Trophy } from "lucide-react";
import type { DailyChallenge, DailyState, PlayerLevel } from "@/game/progressionTypes";
import { ArcadeBackdrop } from "./ArcadeBackdrop";
import { DailyChallengeCard } from "./DailyChallengeCard";
import { XpProgressBar } from "./XpProgressBar";

interface HomeScreenProps {
  level: PlayerLevel;
  modeName: string;
  modeTagline: string;
  modeBestLabel: string;
  isTrainingMode: boolean;
  daily: DailyState;
  challenge: DailyChallenge;
  themeHint: string | null;
  reducedMotion: boolean;
  onPlay: () => void;
  onOpenModes: () => void;
  onOpenAchievements: () => void;
  onOpenStatistics: () => void;
  onOpenThemes: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
  achievementsUnlocked: number;
  achievementsTotal: number;
}

export function HomeScreen({
  level,
  modeName,
  modeTagline,
  modeBestLabel,
  isTrainingMode,
  daily,
  challenge,
  themeHint,
  reducedMotion,
  onPlay,
  onOpenModes,
  onOpenAchievements,
  onOpenStatistics,
  onOpenThemes,
  onOpenSettings,
  onOpenHowToPlay,
  achievementsUnlocked,
  achievementsTotal,
}: HomeScreenProps) {

  return (
    <div className="no-select relative min-h-[100dvh] overflow-hidden">
      <ArcadeBackdrop />
      <div className="safe-area relative mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-5 py-5">
        {/* ---- top ---- */}
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <span className="sticker-sm grid h-11 min-w-11 place-items-center rounded-full border border-neon-gold/70 bg-arcade-surface px-3 text-sm text-neon-gold">
            L{level.level}
          </span>
          <p className="truncate text-center text-[11px] font-bold tracking-[0.3em] text-arcade-text/70">
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

        <div className="mt-5">
          <h1 className="sticker-text flex flex-wrap items-end gap-x-3 text-[clamp(42px,13vw,68px)] leading-[0.88]">
            <span className="text-neon-green glow-green">Tap</span>
            <span className="text-[0.55em] text-arcade-text glow-white">or</span>
            <span className="text-neon-red glow-red">Trap</span>
          </h1>
          <p className="mt-2 text-base font-black tracking-tight text-arcade-text/90">
            Tap fast. Think faster.
          </p>
        </div>

        {/* ---- progression ---- */}
        <div className="mt-3 rounded-2xl border border-arcade-line bg-arcade-surface px-4 py-3">
          <XpProgressBar
            level={level.level}
            currentXp={level.currentXp}
            xpForNext={level.xpForNext}
            reducedMotion={reducedMotion}
            compact
          />
          <p className="sticker-sm mt-2 text-[11px] tracking-[0.16em] text-arcade-text/75">
            STREAK {daily.currentStreak}
          </p>
        </div>

        {/* ---- mode + best ---- */}
        <button
          type="button"
          onClick={onOpenModes}
          className="mt-3 w-full rounded-2xl border border-arcade-line bg-arcade-surface px-4 py-3 text-left"
        >
          <span className="sticker-sm block text-[10px] tracking-[0.24em] text-arcade-text/70">
            {isTrainingMode ? "TRAINING" : "MODE"}
          </span>
          <span className="mt-1 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3">
            <span
              className={`sticker-sm min-w-0 truncate text-lg ${
                isTrainingMode ? "text-neon-purple" : "text-neon-green"
              }`}
            >
              {modeName}
            </span>
            <span className="sticker-sm shrink-0 text-sm tracking-[0.14em] text-neon-gold tabular-nums">
              {modeBestLabel}
            </span>
            <ChevronRight className="size-5 shrink-0 text-arcade-text/70" aria-hidden />
          </span>
          <span className="mt-1 block truncate text-xs font-semibold text-arcade-text/75">
            {modeTagline}
          </span>

        </button>

        {/* ---- play ---- */}
        <button
          type="button"
          onClick={onPlay}
          className="arcade-btn sticker-sm mt-4 min-h-16 w-full bg-neon-green py-4 text-3xl tracking-tight text-arcade-bg-deep shadow-[0_0_28px_-10px_var(--neon-green)]"
        >
          <span className={reducedMotion ? "" : "animate-wiggle"}>Play →</span>
        </button>

        {/* ---- lower ---- */}
        <div className="mt-4 grid gap-3 pb-4">
          <DailyChallengeCard challenge={challenge} daily={daily} reducedMotion={reducedMotion} />

          <div className="grid grid-cols-2 gap-2.5">
            <NavTile
              icon={<Trophy className="size-4" aria-hidden />}
              label="Achievements"
              sub={`${achievementsUnlocked}/${achievementsTotal}`}
              onClick={onOpenAchievements}
            />
            <NavTile
              icon={<BarChart3 className="size-4" aria-hidden />}
              label="Statistics"
              sub="Lifetime data"
              onClick={onOpenStatistics}
            />
            <NavTile
              icon={<Palette className="size-4" aria-hidden />}
              label="Themes"
              sub={themeHint ?? "Unlock looks"}
              onClick={onOpenThemes}
            />
            <NavTile
              icon={<HelpCircle className="size-4" aria-hidden />}
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
      className="flex min-h-16 flex-col justify-center gap-0.5 rounded-2xl border border-arcade-line/70 bg-arcade-surface/80 px-3.5 py-2.5 text-left text-arcade-text transition-colors active:bg-arcade-surface"
    >
      <span className="flex items-center gap-2">
        <span className="text-arcade-text/80">{icon}</span>
        <span className="truncate text-sm font-black tracking-tight">{label}</span>
      </span>
      <span className="truncate text-[11px] font-semibold text-arcade-text/70">{sub}</span>
    </button>
  );
}
