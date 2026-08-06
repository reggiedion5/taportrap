import { presetFor, type Difficulty } from "./difficulty";
import type { GameMode } from "./modes";
import type {
  GameSessionResult,
  PlayerLevel,
  PlayerProfile,
  XpRewardBreakdown,
} from "./progressionTypes";

/** XP required to advance FROM the given level. */
export function xpForLevel(level: number): number {
  const safe = Math.max(1, Math.floor(Number.isFinite(level) ? level : 1));
  return 100 + (safe - 1) * 40;
}

export function levelProgress(profile: PlayerProfile): PlayerLevel {
  const level = Math.max(1, Math.floor(profile.level) || 1);
  const xpForNext = xpForLevel(level);
  const currentXp = Math.max(0, Math.min(profile.currentXp, xpForNext));
  return {
    level,
    currentXp,
    xpForNext,
    progress: xpForNext > 0 ? currentXp / xpForNext : 0,
  };
}

export interface LevelUpResult {
  level: number;
  currentXp: number;
  lifetimeXp: number;
  levelsGained: number;
}

export function applyXp(profile: PlayerProfile, amount: number): LevelUpResult {
  const gain = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
  let level = Math.max(1, Math.floor(profile.level) || 1);
  let currentXp = Math.max(0, Math.floor(profile.currentXp) || 0) + gain;
  let levelsGained = 0;
  // guard against runaway loops from corrupt data
  for (let i = 0; i < 1000; i += 1) {
    const need = xpForLevel(level);
    if (currentXp < need) break;
    currentXp -= need;
    level += 1;
    levelsGained += 1;
  }
  const lifetimeXp = Math.max(0, Math.floor(profile.lifetimeXp) || 0) + gain;
  return { level, currentXp, lifetimeXp, levelsGained };
}

interface XpContext {
  result: GameSessionResult;
  isNewModeHighScore: boolean;
  difficulty?: Difficulty;
}

export function calculateXpRewards({
  result,
  isNewModeHighScore,
  difficulty,
}: XpContext): XpRewardBreakdown {
  const entries: { label: string; xp: number }[] = [];
  const { stats, score, bestCombo, mode } = result;
  const add = (label: string, xp: number) => {
    if (xp > 0) entries.push({ label, xp });
  };

  const modeLabel: Record<GameMode, string> = {
    classic: "Classic",
    blitz: "Blitz",
    survival: "Survival",
    focus: "Focus",
  };

  if (mode === "blitz") {
    add("Points scored", Math.max(0, score));
    if (score >= 30) add("30+ point run", 10);
  } else {
    add("Successful reactions", stats.successes * 2);
    if (mode !== "survival") add("Perfect reactions", stats.perfect);
    if (mode === "classic" && bestCombo >= 10) add("Combo 10 reached", 10);
    if (mode === "survival" && stats.successes >= 25) add("25+ reactions", 15);
    if (mode === "focus" && stats.avgReaction !== null && stats.avgReaction < 350) {
      add("Sub-350ms average", 20);
    }
  }

  /* ---- Phase 2 timing bonuses (same for every mode) ---- */
  add("Great timing", Math.max(0, stats.great ?? 0));
  add("Close calls", Math.max(0, stats.closeCalls ?? 0) * 2);
  const comboBonus = bestCombo >= 30 ? 40 : bestCombo >= 20 ? 25 : bestCombo >= 15 ? 15 : 0;
  add(`Combo ${bestCombo} milestone`, comboBonus);

  if (isNewModeHighScore && score > 0) {
    add(`New ${modeLabel[mode]} best`, 25);
  }

  const base = entries.reduce((sum, e) => sum + e.xp, 0);
  const preset = presetFor(difficulty);
  const total = Math.max(0, Math.round(base * preset.xpScale));
  if (base > 0 && preset.xpScale !== 1) {
    entries.push({
      label: `${preset.label} difficulty (x${preset.xpScale})`,
      xp: total - base,
    });
  }
  return { entries, total };
}
