import type { ThemeDefinition } from "./progressionTypes";

export const THEMES: ThemeDefinition[] = [
  {
    id: "neon-night",
    name: "Neon Night",
    description: "The original dark navy arcade with full-strength neon.",
    unlock: { kind: "default" },
    unlockLabel: "Available by default",
    swatch: ["#0b0f2a", "#4ef58c", "#ff4d4d", "#ffd24a"],
  },
  {
    id: "cyber-grid",
    name: "Cyber Grid",
    description: "Blue-black digital interface with cyan accents.",
    unlock: { kind: "level", value: 3 },
    unlockLabel: "Reach Level 3",
    swatch: ["#05101c", "#37f0e0", "#ff5470", "#ffd166"],
  },
  {
    id: "lava-rush",
    name: "Lava Rush",
    description: "Charcoal and ember glow with a molten interface.",
    unlock: { kind: "level", value: 6 },
    unlockLabel: "Reach Level 6",
    swatch: ["#160d0a", "#ff8a3d", "#ff3b30", "#ffc14d"],
  },
  {
    id: "arctic-pulse",
    name: "Arctic Pulse",
    description: "Deep blue frost with icy panels.",
    unlock: { kind: "daily", value: 3 },
    unlockLabel: "Complete 3 daily challenges",
    swatch: ["#061426", "#7fe9ff", "#ff6b8a", "#e8f6ff"],
  },
  {
    id: "royal-voltage",
    name: "Royal Voltage",
    description: "Black and violet with metallic gold interface accents.",
    unlock: { kind: "achievements", value: 10 },
    unlockLabel: "Earn 10 achievements",
    swatch: ["#0a0512", "#c8a24a", "#b14bff", "#ffe6a3"],
  },
  {
    id: "hyperdrive",
    name: "Hyperdrive",
    description: "Deep space with drifting stars and speed lines.",
    unlock: { kind: "level", value: 12 },
    unlockLabel: "Reach Level 12",
    swatch: ["#02030f", "#8affd1", "#ff5cf0", "#9db6ff"],
  },
];

export const DEFAULT_THEME_ID = "neon-night";

export function themeById(id: string): ThemeDefinition {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export interface ThemeUnlockContext {
  level: number;
  dailyCompleted: number;
  achievementsUnlocked: number;
}

export function isThemeUnlocked(theme: ThemeDefinition, ctx: ThemeUnlockContext): boolean {
  switch (theme.unlock.kind) {
    case "default":
      return true;
    case "level":
      return ctx.level >= theme.unlock.value;
    case "daily":
      return ctx.dailyCompleted >= theme.unlock.value;
    case "achievements":
      return ctx.achievementsUnlocked >= theme.unlock.value;
    default:
      return false;
  }
}

export function evaluateThemeUnlocks(ctx: ThemeUnlockContext): string[] {
  return THEMES.filter((t) => isThemeUnlocked(t, ctx)).map((t) => t.id);
}

export function themeUnlockProgress(
  theme: ThemeDefinition,
  ctx: ThemeUnlockContext,
): { value: number; target: number } | null {
  switch (theme.unlock.kind) {
    case "level":
      return { value: ctx.level, target: theme.unlock.value };
    case "daily":
      return { value: ctx.dailyCompleted, target: theme.unlock.value };
    case "achievements":
      return { value: ctx.achievementsUnlocked, target: theme.unlock.value };
    default:
      return null;
  }
}
