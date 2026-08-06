/**
 * Board Collection — 15 unlockable gameplay environments.
 *
 * A board changes atmosphere only: background art, ambient effect and interface
 * tint. Target colours, sizes, timing and scoring are never touched, and every
 * board ships a readability scrim so green / red / gold / purple stay obvious.
 */

export type BoardId =
  | "neon-night"
  | "cyber-grid"
  | "midnight-ember"
  | "lava-rush"
  | "arctic-pulse"
  | "rain-city"
  | "sakura-drift"
  | "royal-voltage"
  | "desert-mirage"
  | "deep-abyss"
  | "circuit-forest"
  | "vaporwave-mall"
  | "hyperdrive"
  | "solar-flare"
  | "quantum-void";

export type BoardCategory = "starter" | "elemental" | "nature" | "tech" | "cosmic";

/** CSS class suffix of the ambient layer defined in src/styles.css. */
export type BoardEffect =
  | "none"
  | "grid"
  | "embers"
  | "snow"
  | "rain"
  | "petals"
  | "sand"
  | "bubbles"
  | "fireflies"
  | "scanlines"
  | "stars"
  | "flare"
  | "quantum";

export type BoardUnlock =
  | { kind: "default" }
  | { kind: "level"; value: number }
  | { kind: "daily"; value: number }
  | { kind: "streak"; value: number }
  | { kind: "achievements"; value: number }
  | { kind: "games"; value: number }
  | { kind: "combo"; value: number }
  | { kind: "perfect"; value: number }
  | { kind: "gold"; value: number }
  | { kind: "traps"; value: number }
  | { kind: "purple"; value: number }
  | { kind: "score"; value: number };

export interface BoardDefinition {
  id: BoardId;
  name: string;
  description: string;
  category: BoardCategory;
  /** three-stop preview swatch used in the collection grid */
  swatch: [string, string, string];
  /** interface palette overrides applied to :root when equipped */
  vars: Record<string, string>;
  /** static base background for the environment layer */
  base: string;
  effect: BoardEffect;
  unlock: BoardUnlock;
  unlockLabel: string;
}

export const DEFAULT_BOARD_ID: BoardId = "neon-night";

export const BOARDS: BoardDefinition[] = [
  {
    id: "neon-night",
    name: "Neon Night",
    description: "The original deep navy arcade cabinet with full-strength neon.",
    category: "starter",
    swatch: ["#0b0f2a", "#4ef58c", "#ff4d4d"],
    vars: {},
    base: "linear-gradient(180deg,oklch(0.14 0.045 268),oklch(0.07 0.03 268))",
    effect: "none",
    unlock: { kind: "default" },
    unlockLabel: "Available by default",
  },
  {
    id: "cyber-grid",
    name: "Cyber Grid",
    description: "A blue-black data plane with a slow scrolling wireframe horizon.",
    category: "starter",
    swatch: ["#05101c", "#37f0e0", "#0b6b7a"],
    vars: {
      "--arcade-bg": "oklch(0.17 0.045 240)",
      "--arcade-bg-deep": "oklch(0.1 0.04 240)",
      "--arcade-surface": "oklch(0.24 0.05 230)",
      "--arcade-line": "oklch(0.44 0.11 210)",
    },
    base: "linear-gradient(180deg,oklch(0.16 0.05 232),oklch(0.07 0.035 232))",
    effect: "grid",
    unlock: { kind: "default" },
    unlockLabel: "Available by default",
  },
  {
    id: "midnight-ember",
    name: "Midnight Ember",
    description: "Charcoal dark with warm embers drifting up from the floor.",
    category: "starter",
    swatch: ["#120c0b", "#ff9a4d", "#5a2a12"],
    vars: {
      "--arcade-bg": "oklch(0.17 0.02 40)",
      "--arcade-bg-deep": "oklch(0.1 0.018 40)",
      "--arcade-surface": "oklch(0.24 0.03 40)",
    },
    base: "linear-gradient(180deg,oklch(0.13 0.02 45),oklch(0.07 0.015 30))",
    effect: "embers",
    unlock: { kind: "default" },
    unlockLabel: "Available by default",
  },
  {
    id: "lava-rush",
    name: "Lava Rush",
    description: "Molten rock glow rising from a cracked volcanic floor.",
    category: "elemental",
    swatch: ["#160d0a", "#ff5a1f", "#7d1d0b"],
    vars: {
      "--arcade-bg": "oklch(0.18 0.03 40)",
      "--arcade-bg-deep": "oklch(0.11 0.025 40)",
      "--arcade-surface": "oklch(0.25 0.05 40)",
      "--arcade-line": "oklch(0.45 0.11 45)",
    },
    base:
      "radial-gradient(120% 70% at 50% 118%,oklch(0.55 0.19 42),transparent 62%)," +
      "linear-gradient(180deg,oklch(0.14 0.03 35),oklch(0.08 0.02 30))",
    effect: "embers",
    unlock: { kind: "level", value: 4 },
    unlockLabel: "Reach Level 4",
  },
  {
    id: "arctic-pulse",
    name: "Arctic Pulse",
    description: "Frozen blue tundra with quiet snowfall and icy panels.",
    category: "elemental",
    swatch: ["#061426", "#7fe9ff", "#1d4c6b"],
    vars: {
      "--arcade-bg": "oklch(0.19 0.04 235)",
      "--arcade-bg-deep": "oklch(0.12 0.035 235)",
      "--arcade-surface": "oklch(0.27 0.045 230)",
      "--arcade-line": "oklch(0.5 0.07 225)",
    },
    base:
      "radial-gradient(110% 60% at 50% -12%,oklch(0.5 0.09 225),transparent 62%)," +
      "linear-gradient(180deg,oklch(0.16 0.04 232),oklch(0.09 0.03 232))",
    effect: "snow",
    unlock: { kind: "daily", value: 3 },
    unlockLabel: "Complete 3 daily challenges",
  },
  {
    id: "rain-city",
    name: "Rain City",
    description: "A neon-soaked street at night with steady falling rain.",
    category: "elemental",
    swatch: ["#070c14", "#5ad2ff", "#2a1740"],
    vars: {
      "--arcade-bg": "oklch(0.16 0.03 255)",
      "--arcade-bg-deep": "oklch(0.09 0.025 255)",
      "--arcade-line": "oklch(0.46 0.08 250)",
    },
    base:
      "radial-gradient(80% 45% at 20% 100%,oklch(0.44 0.13 200),transparent 60%)," +
      "radial-gradient(70% 40% at 85% 100%,oklch(0.4 0.16 330),transparent 60%)," +
      "linear-gradient(180deg,oklch(0.12 0.03 255),oklch(0.06 0.02 255))",
    effect: "rain",
    unlock: { kind: "games", value: 25 },
    unlockLabel: "Play 25 games",
  },
  {
    id: "sakura-drift",
    name: "Sakura Drift",
    description: "A dusk garden where blossom petals drift across the board.",
    category: "nature",
    swatch: ["#170a16", "#ff9ec9", "#4b2140"],
    vars: {
      "--arcade-bg": "oklch(0.18 0.04 340)",
      "--arcade-bg-deep": "oklch(0.11 0.035 340)",
      "--arcade-surface": "oklch(0.25 0.05 335)",
      "--arcade-line": "oklch(0.5 0.09 340)",
    },
    base:
      "radial-gradient(110% 60% at 50% -10%,oklch(0.42 0.11 345),transparent 62%)," +
      "linear-gradient(180deg,oklch(0.15 0.04 340),oklch(0.08 0.03 330))",
    effect: "petals",
    unlock: { kind: "combo", value: 20 },
    unlockLabel: "Reach a 20 combo",
  },
  {
    id: "royal-voltage",
    name: "Royal Voltage",
    description: "Black velvet and violet with metallic gold interface accents.",
    category: "nature",
    swatch: ["#0a0512", "#c8a24a", "#5b2a8c"],
    vars: {
      "--arcade-bg": "oklch(0.16 0.05 305)",
      "--arcade-bg-deep": "oklch(0.09 0.04 305)",
      "--arcade-surface": "oklch(0.24 0.06 305)",
      "--arcade-line": "oklch(0.55 0.11 90)",
    },
    base:
      "linear-gradient(160deg,oklch(0.28 0.11 305),transparent 58%)," +
      "linear-gradient(180deg,oklch(0.13 0.05 305),oklch(0.07 0.035 305))",
    effect: "fireflies",
    unlock: { kind: "achievements", value: 10 },
    unlockLabel: "Earn 10 achievements",
  },
  {
    id: "desert-mirage",
    name: "Desert Mirage",
    description: "Dune horizon at golden hour with sand blowing across the screen.",
    category: "nature",
    swatch: ["#1a1206", "#ffc46b", "#6b4517"],
    vars: {
      "--arcade-bg": "oklch(0.19 0.035 75)",
      "--arcade-bg-deep": "oklch(0.11 0.03 70)",
      "--arcade-surface": "oklch(0.26 0.04 75)",
      "--arcade-line": "oklch(0.52 0.09 80)",
    },
    base:
      "radial-gradient(100% 55% at 50% 105%,oklch(0.52 0.12 78),transparent 62%)," +
      "linear-gradient(180deg,oklch(0.16 0.035 70),oklch(0.09 0.025 60))",
    effect: "sand",
    unlock: { kind: "gold", value: 100 },
    unlockLabel: "Collect 100 gold targets",
  },
  {
    id: "deep-abyss",
    name: "Deep Abyss",
    description: "Far below the surface, with slow bubbles and a cold current.",
    category: "nature",
    swatch: ["#030d14", "#3fd8d0", "#0a3346"],
    vars: {
      "--arcade-bg": "oklch(0.15 0.035 210)",
      "--arcade-bg-deep": "oklch(0.08 0.03 210)",
      "--arcade-surface": "oklch(0.22 0.04 205)",
      "--arcade-line": "oklch(0.45 0.08 200)",
    },
    base:
      "radial-gradient(110% 60% at 50% -18%,oklch(0.4 0.09 205),transparent 60%)," +
      "linear-gradient(180deg,oklch(0.11 0.03 210),oklch(0.05 0.02 210))",
    effect: "bubbles",
    unlock: { kind: "traps", value: 150 },
    unlockLabel: "Avoid 150 traps",
  },
  {
    id: "circuit-forest",
    name: "Circuit Forest",
    description: "Bio-luminescent woodland wired with softly pulsing circuitry.",
    category: "tech",
    swatch: ["#04140c", "#63ffae", "#0d4a2c"],
    vars: {
      "--arcade-bg": "oklch(0.17 0.04 155)",
      "--arcade-bg-deep": "oklch(0.1 0.035 155)",
      "--arcade-surface": "oklch(0.24 0.045 155)",
      "--arcade-line": "oklch(0.48 0.1 155)",
    },
    base:
      "radial-gradient(100% 55% at 50% 110%,oklch(0.42 0.13 155),transparent 60%)," +
      "linear-gradient(180deg,oklch(0.13 0.035 155),oklch(0.07 0.025 155))",
    effect: "fireflies",
    unlock: { kind: "perfect", value: 100 },
    unlockLabel: "Land 100 perfect taps",
  },
  {
    id: "vaporwave-mall",
    name: "Vaporwave Mall",
    description: "Retro CRT plaza with scanlines and a magenta sunset grid.",
    category: "tech",
    swatch: ["#12061f", "#ff77e1", "#2b1a63"],
    vars: {
      "--arcade-bg": "oklch(0.18 0.05 315)",
      "--arcade-bg-deep": "oklch(0.1 0.04 315)",
      "--arcade-surface": "oklch(0.25 0.055 310)",
      "--arcade-line": "oklch(0.55 0.12 320)",
    },
    base:
      "radial-gradient(90% 50% at 50% 100%,oklch(0.5 0.17 330),transparent 60%)," +
      "linear-gradient(180deg,oklch(0.15 0.05 300),oklch(0.08 0.035 300))",
    effect: "scanlines",
    unlock: { kind: "score", value: 60 },
    unlockLabel: "Score 60 in a single run",
  },
  {
    id: "hyperdrive",
    name: "Hyperdrive",
    description: "Deep space with drifting starfields and long speed lines.",
    category: "cosmic",
    swatch: ["#02030f", "#8affd1", "#1b2050"],
    vars: {
      "--arcade-bg": "oklch(0.14 0.04 275)",
      "--arcade-bg-deep": "oklch(0.07 0.03 275)",
      "--arcade-surface": "oklch(0.22 0.05 275)",
      "--arcade-line": "oklch(0.46 0.09 280)",
    },
    base: "linear-gradient(180deg,oklch(0.1 0.035 275),oklch(0.04 0.02 275))",
    effect: "stars",
    unlock: { kind: "level", value: 12 },
    unlockLabel: "Reach Level 12",
  },
  {
    id: "solar-flare",
    name: "Solar Flare",
    description: "Orbiting a white-hot star as flares wash across the board.",
    category: "cosmic",
    swatch: ["#180a02", "#ffcf5c", "#7a2f08"],
    vars: {
      "--arcade-bg": "oklch(0.18 0.04 60)",
      "--arcade-bg-deep": "oklch(0.1 0.03 55)",
      "--arcade-surface": "oklch(0.25 0.045 60)",
      "--arcade-line": "oklch(0.55 0.11 70)",
    },
    base:
      "radial-gradient(70% 45% at 82% -10%,oklch(0.7 0.16 80),transparent 60%)," +
      "linear-gradient(180deg,oklch(0.14 0.035 50),oklch(0.07 0.025 40))",
    effect: "flare",
    unlock: { kind: "level", value: 20 },
    unlockLabel: "Reach Level 20",
  },
  {
    id: "quantum-void",
    name: "Quantum Void",
    description: "Near-black space folding in on itself with quantum static.",
    category: "cosmic",
    swatch: ["#05060a", "#b9c6ff", "#1a1030"],
    vars: {
      "--arcade-bg": "oklch(0.14 0.02 285)",
      "--arcade-bg-deep": "oklch(0.06 0.015 285)",
      "--arcade-surface": "oklch(0.21 0.03 285)",
      "--arcade-line": "oklch(0.45 0.05 285)",
    },
    base:
      "radial-gradient(70% 50% at 50% 50%,oklch(0.28 0.08 290),transparent 62%)," +
      "linear-gradient(180deg,oklch(0.09 0.02 285),oklch(0.04 0.012 285))",
    effect: "quantum",
    unlock: { kind: "achievements", value: 20 },
    unlockLabel: "Earn 20 achievements",
  },
];

export const BOARD_CATEGORY_LABEL: Record<BoardCategory, string> = {
  starter: "Starter",
  elemental: "Elemental",
  nature: "World",
  tech: "Tech",
  cosmic: "Cosmic",
};

export interface BoardUnlockContext {
  level: number;
  dailyCompleted: number;
  dailyStreak: number;
  achievementsUnlocked: number;
  gamesPlayed: number;
  bestCombo: number;
  perfectCount: number;
  totalGold: number;
  totalTrapsAvoided: number;
  totalPurpleCompletions: number;
  bestScore: number;
}

export function emptyBoardContext(): BoardUnlockContext {
  return {
    level: 1,
    dailyCompleted: 0,
    dailyStreak: 0,
    achievementsUnlocked: 0,
    gamesPlayed: 0,
    bestCombo: 0,
    perfectCount: 0,
    totalGold: 0,
    totalTrapsAvoided: 0,
    totalPurpleCompletions: 0,
    bestScore: 0,
  };
}

export function isBoardId(value: unknown): value is BoardId {
  return typeof value === "string" && BOARDS.some((b) => b.id === value);
}

export function boardById(id: string): BoardDefinition {
  return BOARDS.find((b) => b.id === id) ?? BOARDS[0];
}

function contextValue(unlock: BoardUnlock, ctx: BoardUnlockContext): number {
  switch (unlock.kind) {
    case "default":
      return 1;
    case "level":
      return ctx.level;
    case "daily":
      return ctx.dailyCompleted;
    case "streak":
      return ctx.dailyStreak;
    case "achievements":
      return ctx.achievementsUnlocked;
    case "games":
      return ctx.gamesPlayed;
    case "combo":
      return ctx.bestCombo;
    case "perfect":
      return ctx.perfectCount;
    case "gold":
      return ctx.totalGold;
    case "traps":
      return ctx.totalTrapsAvoided;
    case "purple":
      return ctx.totalPurpleCompletions;
    case "score":
      return ctx.bestScore;
    default:
      return 0;
  }
}

export function isBoardUnlocked(board: BoardDefinition, ctx: BoardUnlockContext): boolean {
  if (board.unlock.kind === "default") return true;
  return contextValue(board.unlock, ctx) >= board.unlock.value;
}

export function evaluateBoardUnlocks(ctx: BoardUnlockContext): BoardId[] {
  return BOARDS.filter((b) => isBoardUnlocked(b, ctx)).map((b) => b.id);
}

export function boardUnlockProgress(
  board: BoardDefinition,
  ctx: BoardUnlockContext,
): { value: number; target: number; ratio: number } | null {
  if (board.unlock.kind === "default") return null;
  const target = board.unlock.value;
  const value = Math.min(contextValue(board.unlock, ctx), target);
  return { value, target, ratio: target > 0 ? value / target : 1 };
}

/** Board closest to unlocking — used for the home-screen hint. */
export function nextBoardHint(ctx: BoardUnlockContext): string | null {
  let best: { board: BoardDefinition; ratio: number } | null = null;
  for (const board of BOARDS) {
    if (isBoardUnlocked(board, ctx)) continue;
    const progress = boardUnlockProgress(board, ctx);
    if (!progress) continue;
    if (!best || progress.ratio > best.ratio) best = { board, ratio: progress.ratio };
  }
  if (!best) return null;
  return `${best.board.unlockLabel} → ${best.board.name}`;
}
