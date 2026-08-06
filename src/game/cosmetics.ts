/**
 * Player titles and collectible badges.
 *
 * Both are cosmetic only. Unlock state is evaluated from canonical saved data
 * so a title or badge can never be lost, and unlocking is idempotent.
 */

import type { BadgeTier, CollectibleBadge, PlayerTitle } from "./phase3Types";

export interface CosmeticContext {
  perfectCount: number;
  bestCombo: number;
  closeCalls: number;
  chaosRuns: number;
  boardsEquipped: number;
  boardsUnlocked: number;
  boardsTotal: number;
  dailyMissionsCompleted: number;
  playStreakLongest: number;
  gamesPlayed: number;
  level: number;
  bestScore: number;
  bestExpertScore: number;
  loginCyclesCompleted: number;
}

export function emptyCosmeticContext(): CosmeticContext {
  return {
    perfectCount: 0,
    bestCombo: 0,
    closeCalls: 0,
    chaosRuns: 0,
    boardsEquipped: 0,
    boardsUnlocked: 0,
    boardsTotal: 1,
    dailyMissionsCompleted: 0,
    playStreakLongest: 0,
    gamesPlayed: 0,
    level: 1,
    bestScore: 0,
    bestExpertScore: 0,
    loginCyclesCompleted: 0,
  };
}

interface Requirement {
  label: string;
  value: (ctx: CosmeticContext) => number;
  target: (ctx: CosmeticContext) => number;
}

export interface TitleDefinition extends PlayerTitle {
  requirement: Requirement;
}

export interface BadgeDefinition extends CollectibleBadge {
  requirement: Requirement;
}

const req = (
  label: string,
  value: (ctx: CosmeticContext) => number,
  target: number | ((ctx: CosmeticContext) => number),
): Requirement => ({
  label,
  value,
  target: typeof target === "number" ? () => target : target,
});

export const DEFAULT_TITLE_ID = "rookie";

export const TITLES: TitleDefinition[] = [
  {
    id: "rookie",
    name: "ROOKIE",
    description: "Where everyone starts.",
    requirement: req("Unlocked by default", () => 1, 1),
  },
  {
    id: "quick-hands",
    name: "QUICK HANDS",
    description: "Earn 25 Perfect taps.",
    requirement: req("Perfect taps", (c) => c.perfectCount, 25),
  },
  {
    id: "hot-streak",
    name: "HOT STREAK",
    description: "Reach a 15 combo.",
    requirement: req("Best combo", (c) => c.bestCombo, 15),
  },
  {
    id: "combo-king",
    name: "COMBO KING",
    description: "Reach a 30 combo.",
    requirement: req("Best combo", (c) => c.bestCombo, 30),
  },
  {
    id: "lightning-reflexes",
    name: "LIGHTNING REFLEXES",
    description: "Earn 250 Perfect taps.",
    requirement: req("Perfect taps", (c) => c.perfectCount, 250),
  },
  {
    id: "clutch-player",
    name: "CLUTCH PLAYER",
    description: "Earn 50 close calls.",
    requirement: req("Close calls", (c) => c.closeCalls, 50),
  },
  {
    id: "speed-demon",
    name: "SPEED DEMON",
    description: "Reach the Chaos tier 10 times.",
    requirement: req("Chaos runs", (c) => c.chaosRuns, 10),
  },
  {
    id: "board-explorer",
    name: "BOARD EXPLORER",
    description: "Equip 5 different boards.",
    requirement: req("Boards equipped", (c) => c.boardsEquipped, 5),
  },
  {
    id: "board-master",
    name: "BOARD MASTER",
    description: "Unlock every board.",
    requirement: req(
      "Boards unlocked",
      (c) => c.boardsUnlocked,
      (c) => c.boardsTotal,
    ),
  },
  {
    id: "mission-grinder",
    name: "MISSION GRINDER",
    description: "Complete 25 daily missions.",
    requirement: req("Daily missions", (c) => c.dailyMissionsCompleted, 25),
  },
  {
    id: "dedicated",
    name: "DEDICATED",
    description: "Reach a 14-day play streak.",
    requirement: req("Longest streak", (c) => c.playStreakLongest, 14),
  },
  {
    id: "veteran",
    name: "VETERAN",
    description: "Complete 500 games.",
    requirement: req("Games played", (c) => c.gamesPlayed, 500),
  },
  {
    id: "grand-master",
    name: "GRAND MASTER",
    description: "Reach Level 50.",
    requirement: req("Level", (c) => c.level, 50),
  },
  {
    id: "legend",
    name: "LEGEND",
    description: "Score 150 in a single run.",
    requirement: req("Best score", (c) => c.bestScore, 150),
  },
];

export const BADGES: BadgeDefinition[] = [
  {
    id: "first-run",
    name: "First Run",
    description: "Complete one game.",
    tier: "bronze",
    icon: "flag",
    requirement: req("Games played", (c) => c.gamesPlayed, 1),
  },
  {
    id: "perfect-100",
    name: "Perfect 100",
    description: "Earn 100 Perfect taps.",
    tier: "silver",
    icon: "target",
    requirement: req("Perfect taps", (c) => c.perfectCount, 100),
  },
  {
    id: "combo-50",
    name: "Combo 50",
    description: "Reach a 50 combo.",
    tier: "gold",
    icon: "flame",
    requirement: req("Best combo", (c) => c.bestCombo, 50),
  },
  {
    id: "century-score",
    name: "Century Score",
    description: "Score 100 in one run.",
    tier: "gold",
    icon: "star",
    requirement: req("Best score", (c) => c.bestScore, 100),
  },
  {
    id: "expert-75",
    name: "Expert 75",
    description: "Score 75 on Expert.",
    tier: "diamond",
    icon: "gem",
    requirement: req("Expert best", (c) => c.bestExpertScore, 75),
  },
  {
    id: "board-collector",
    name: "Board Collector",
    description: "Unlock 10 boards.",
    tier: "gold",
    icon: "palette",
    requirement: req("Boards unlocked", (c) => c.boardsUnlocked, 10),
  },
  {
    id: "all-boards",
    name: "All Boards",
    description: "Unlock every board.",
    tier: "diamond",
    icon: "grid",
    requirement: req(
      "Boards unlocked",
      (c) => c.boardsUnlocked,
      (c) => c.boardsTotal,
    ),
  },
  {
    id: "streak-7",
    name: "Streak 7",
    description: "Reach a 7-day play streak.",
    tier: "bronze",
    icon: "calendar",
    requirement: req("Longest streak", (c) => c.playStreakLongest, 7),
  },
  {
    id: "streak-30",
    name: "Streak 30",
    description: "Reach a 30-day play streak.",
    tier: "silver",
    icon: "calendar",
    requirement: req("Longest streak", (c) => c.playStreakLongest, 30),
  },
  {
    id: "streak-100",
    name: "Streak 100",
    description: "Reach a 100-day play streak.",
    tier: "gold",
    icon: "calendar",
    requirement: req("Longest streak", (c) => c.playStreakLongest, 100),
  },
  {
    id: "mission-50",
    name: "Mission 50",
    description: "Complete 50 daily missions.",
    tier: "gold",
    icon: "check",
    requirement: req("Daily missions", (c) => c.dailyMissionsCompleted, 50),
  },
  {
    id: "level-50",
    name: "Level 50",
    description: "Reach Level 50.",
    tier: "diamond",
    icon: "zap",
    requirement: req("Level", (c) => c.level, 50),
  },
  {
    id: "login-7",
    name: "Login 7",
    description: "Complete one full login cycle.",
    tier: "bronze",
    icon: "gift",
    requirement: req("Login cycles", (c) => c.loginCyclesCompleted, 1),
  },
];

export const BADGE_TIER_LABEL: Record<BadgeTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  diamond: "Diamond",
};

export function titleById(id: string): TitleDefinition {
  return TITLES.find((t) => t.id === id) ?? TITLES[0];
}

export function badgeById(id: string): BadgeDefinition | null {
  return BADGES.find((b) => b.id === id) ?? null;
}

export function requirementProgress(
  requirement: Requirement,
  ctx: CosmeticContext,
): { value: number; target: number; met: boolean } {
  const target = Math.max(1, requirement.target(ctx));
  const value = Math.max(0, requirement.value(ctx));
  return { value, target, met: value >= target };
}

/** Ids newly satisfied by `ctx` that are not already in `unlocked`. */
export function evaluateTitles(ctx: CosmeticContext, unlocked: string[]): string[] {
  return TITLES.filter(
    (t) => !unlocked.includes(t.id) && requirementProgress(t.requirement, ctx).met,
  ).map((t) => t.id);
}

export function evaluateBadges(ctx: CosmeticContext, unlocked: string[]): string[] {
  return BADGES.filter(
    (b) => !unlocked.includes(b.id) && requirementProgress(b.requirement, ctx).met,
  ).map((b) => b.id);
}
