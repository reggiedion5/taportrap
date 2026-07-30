import type {
  Achievement,
  AchievementCategory,
  AchievementContext,
  AchievementProgress,
  AchievementStore,
} from "./progressionTypes";

const ms = (v: number | null) => (v === null ? "—" : `${v}ms`);

export const ACHIEVEMENTS: Achievement[] = [
  // ---- beginner ----
  {
    id: "first-reaction",
    title: "First Reaction",
    description: "Complete one successful target",
    category: "beginner",
    tier: "bronze",
    rewardXp: 25,
    target: 1,
    value: (c) => c.stats.totalSuccessfulReactions,
  },
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Complete one full game",
    category: "beginner",
    tier: "bronze",
    rewardXp: 25,
    target: 1,
    value: (c) => c.stats.gamesPlayed,
  },
  {
    id: "high-five",
    title: "High Five",
    description: "Reach a combo of 5",
    category: "beginner",
    tier: "bronze",
    rewardXp: 40,
    target: 5,
    value: (c) => c.records.bestCombo,
  },
  // ---- combo ----
  {
    id: "double-trouble",
    title: "Double Trouble",
    description: "Reach a combo of 10",
    category: "combo",
    tier: "silver",
    rewardXp: 60,
    target: 10,
    value: (c) => c.records.bestCombo,
  },
  {
    id: "locked-in",
    title: "Locked In",
    description: "Reach a combo of 20",
    category: "combo",
    tier: "gold",
    rewardXp: 100,
    target: 20,
    value: (c) => c.records.bestCombo,
  },
  {
    id: "untouchable",
    title: "Untouchable",
    description: "Reach a combo of 40",
    category: "combo",
    tier: "platinum",
    rewardXp: 200,
    target: 40,
    value: (c) => c.records.bestCombo,
  },
  // ---- reaction speed ----
  {
    id: "fast-hands",
    title: "Fast Hands",
    description: "Earn 10 PERFECT reactions across all games",
    category: "reaction",
    tier: "bronze",
    rewardXp: 50,
    target: 10,
    value: (c) => c.stats.perfectCount,
  },
  {
    id: "lightning-reflexes",
    title: "Lightning Reflexes",
    description: "Earn 100 PERFECT reactions",
    category: "reaction",
    tier: "gold",
    rewardXp: 150,
    target: 100,
    value: (c) => c.stats.perfectCount,
  },
  {
    id: "inhuman",
    title: "Inhuman",
    description: "Record a reaction under 180ms",
    category: "reaction",
    tier: "platinum",
    rewardXp: 250,
    target: 1,
    value: (c) =>
      c.records.fastestReaction !== null && c.records.fastestReaction < 180
        ? 1
        : 0,
    format: () => "",
  },
  // ---- target mastery ----
  {
    id: "gold-rush",
    title: "Gold Rush",
    description: "Collect 25 gold targets",
    category: "mastery",
    tier: "bronze",
    rewardXp: 75,
    target: 25,
    value: (c) => c.stats.totalGold,
  },
  {
    id: "treasure-hunter",
    title: "Treasure Hunter",
    description: "Collect 100 gold targets",
    category: "mastery",
    tier: "gold",
    rewardXp: 200,
    target: 100,
    value: (c) => c.stats.totalGold,
  },
  {
    id: "trap-dodger",
    title: "Trap Dodger",
    description: "Avoid 50 red traps",
    category: "mastery",
    tier: "silver",
    rewardXp: 100,
    target: 50,
    value: (c) => c.stats.totalTrapsAvoided,
  },
  {
    id: "trap-master",
    title: "Trap Master",
    description: "Avoid 250 red traps",
    category: "mastery",
    tier: "platinum",
    rewardXp: 250,
    target: 250,
    value: (c) => c.stats.totalTrapsAvoided,
  },
  {
    id: "double-tapper",
    title: "Double Tapper",
    description: "Complete 25 purple targets",
    category: "mastery",
    tier: "bronze",
    rewardXp: 75,
    target: 25,
    value: (c) => c.stats.totalPurpleCompletions,
  },
  {
    id: "purple-reign",
    title: "Purple Reign",
    description: "Complete 100 purple targets",
    category: "mastery",
    tier: "gold",
    rewardXp: 200,
    target: 100,
    value: (c) => c.stats.totalPurpleCompletions,
  },
  // ---- modes ----
  {
    id: "classic-contender",
    title: "Classic Contender",
    description: "Score 25 in Classic",
    category: "modes",
    tier: "silver",
    rewardXp: 75,
    target: 25,
    value: (c) => c.records.highScore.classic,
  },
  {
    id: "classic-master",
    title: "Classic Master",
    description: "Score 75 in Classic",
    category: "modes",
    tier: "platinum",
    rewardXp: 250,
    target: 75,
    value: (c) => c.records.highScore.classic,
  },
  {
    id: "blitzed",
    title: "Blitzed",
    description: "Score 30 in Blitz",
    category: "modes",
    tier: "silver",
    rewardXp: 75,
    target: 30,
    value: (c) => c.records.highScore.blitz,
  },
  {
    id: "blitz-champion",
    title: "Blitz Champion",
    description: "Score 75 in Blitz",
    category: "modes",
    tier: "platinum",
    rewardXp: 250,
    target: 75,
    value: (c) => c.records.highScore.blitz,
  },
  {
    id: "survivor",
    title: "Survivor",
    description: "Complete 25 successful reactions in Survival",
    category: "modes",
    tier: "silver",
    rewardXp: 100,
    target: 25,
    value: (c) => c.records.longestSurvivalRun,
  },
  {
    id: "last-one-standing",
    title: "Last One Standing",
    description: "Complete 75 successful reactions in Survival",
    category: "modes",
    tier: "platinum",
    rewardXp: 250,
    target: 75,
    value: (c) => c.records.longestSurvivalRun,
  },
  {
    id: "pure-focus",
    title: "Pure Focus",
    description: "Score 30 in Focus",
    category: "modes",
    tier: "silver",
    rewardXp: 100,
    target: 30,
    value: (c) => c.records.highScore.focus,
  },
  {
    id: "tunnel-vision",
    title: "Tunnel Vision",
    description: "Finish a Focus run with 20+ targets and a sub-350ms average",
    category: "modes",
    tier: "platinum",
    rewardXp: 250,
    target: 1,
    value: (c) => (c.records.focusTunnelVision ? 1 : 0),
    format: () => "",
  },
  // ---- progression ----
  {
    id: "daily-player",
    title: "Daily Player",
    description: "Complete 3 daily challenges",
    category: "progression",
    tier: "silver",
    rewardXp: 100,
    target: 3,
    value: (c) => c.daily.totalCompleted,
  },
  {
    id: "dedicated",
    title: "Dedicated",
    description: "Reach a daily streak of 7",
    category: "progression",
    tier: "platinum",
    rewardXp: 250,
    target: 7,
    value: (c) => c.daily.bestStreak,
  },
  {
    id: "arcade-regular",
    title: "Arcade Regular",
    description: "Play 25 games",
    category: "progression",
    tier: "silver",
    rewardXp: 100,
    target: 25,
    value: (c) => c.stats.gamesPlayed,
  },
  {
    id: "tap-addict",
    title: "Tap Addict",
    description: "Play 100 games",
    category: "progression",
    tier: "platinum",
    rewardXp: 300,
    target: 100,
    value: (c) => c.stats.gamesPlayed,
  },
];

export const ACHIEVEMENT_CATEGORIES: {
  id: AchievementCategory;
  label: string;
}[] = [
  { id: "beginner", label: "Beginner" },
  { id: "combo", label: "Combo" },
  { id: "reaction", label: "Reaction Speed" },
  { id: "mastery", label: "Target Mastery" },
  { id: "modes", label: "Game Modes" },
  { id: "progression", label: "Progression" },
];

export const TIER_LABEL = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
} as const;

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function achievementProgress(
  ctx: AchievementContext,
  store: AchievementStore,
): AchievementProgress[] {
  return ACHIEVEMENTS.map((a) => {
    const raw = a.value(ctx);
    const value = Number.isFinite(raw) ? Math.max(0, raw) : 0;
    const unlockedAt = store.unlocked[a.id] ?? null;
    return {
      id: a.id,
      value: Math.min(value, a.target),
      target: a.target,
      unlocked: unlockedAt !== null || value >= a.target,
      unlockedAt,
    };
  });
}

/** Returns achievements that just crossed their threshold and are not stored yet. */
export function evaluateAchievements(
  ctx: AchievementContext,
  store: AchievementStore,
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => {
    if (store.unlocked[a.id] !== undefined) return false;
    const raw = a.value(ctx);
    return Number.isFinite(raw) && raw >= a.target;
  });
}

export { ms as formatMs };
