import type { GameSettings, LifetimeStats } from "./types";

const SETTINGS_KEY = "tap-or-trap-preferences-v2";
const STATS_KEY = "tap-or-trap-stats-v1";
const HIGH_SCORE_KEY = "tap-or-trap-high-score-v1";

/** legacy keys kept only for one-time migration */
const LEGACY_HIGH_SCORE_KEY = "tap-or-trap:highscore";
const LEGACY_SETTINGS_KEY = "tap-or-trap-settings-v1";

export const DEFAULT_SETTINGS: GameSettings = {
  sound: true,
  vibration: true,
  screenShake: true,
  reducedMotion: false,
  kidsAssist: false,
  skipCountdown: false,
};

export const SETTINGS_STORAGE_KEY = SETTINGS_KEY;

export const DEFAULT_STATS: LifetimeStats = {
  gamesPlayed: 0,
  highestScore: 0,
  bestCombo: 0,
  fastestReaction: null,
  totalCorrect: 0,
  totalGold: 0,
  totalTrapsAvoided: 0,
  totalPurpleCompletions: 0,
};

function safeNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function safeBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function read(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function loadSettings(): GameSettings {
  const raw = read(SETTINGS_KEY) as Record<string, unknown> | null;
  const legacy = raw ? null : (read(LEGACY_SETTINGS_KEY) as Record<string, unknown> | null);
  const source = raw ?? legacy ?? {};
  return {
    sound: safeBool(source.sound, DEFAULT_SETTINGS.sound),
    vibration: safeBool(source.vibration, DEFAULT_SETTINGS.vibration),
    reducedMotion: safeBool(source.reducedMotion, DEFAULT_SETTINGS.reducedMotion),
    kidsAssist: safeBool(source.kidsAssist, DEFAULT_SETTINGS.kidsAssist),
    skipCountdown: safeBool(source.skipCountdown, DEFAULT_SETTINGS.skipCountdown),
  };
}

export function saveSettings(settings: GameSettings) {
  write(SETTINGS_KEY, settings);
}

export function loadHighScore(): number {
  const current = read(HIGH_SCORE_KEY);
  const value = safeNumber(current, NaN);
  if (Number.isFinite(value) && value >= 0) return Math.floor(value);

  // migrate the pre-v1 plain-number key without destroying it
  if (typeof window !== "undefined") {
    try {
      const legacy = window.localStorage.getItem(LEGACY_HIGH_SCORE_KEY);
      const legacyValue = safeNumber(legacy, 0);
      if (legacyValue > 0) {
        write(HIGH_SCORE_KEY, Math.floor(legacyValue));
        return Math.floor(legacyValue);
      }
    } catch {
      /* ignore */
    }
  }
  return 0;
}

export function saveHighScore(score: number) {
  const value = safeNumber(score, 0);
  if (!Number.isFinite(value) || value < 0) return;
  write(HIGH_SCORE_KEY, Math.floor(value));
}

export function loadStats(): LifetimeStats {
  const source = (read(STATS_KEY) as Record<string, unknown> | null) ?? {};
  return {
    gamesPlayed: Math.max(0, Math.floor(safeNumber(source.gamesPlayed))),
    highestScore: Math.max(0, Math.floor(safeNumber(source.highestScore))),
    bestCombo: Math.max(0, Math.floor(safeNumber(source.bestCombo))),
    fastestReaction: safeOptionalNumber(source.fastestReaction),
    totalCorrect: Math.max(0, Math.floor(safeNumber(source.totalCorrect))),
    totalGold: Math.max(0, Math.floor(safeNumber(source.totalGold))),
    totalTrapsAvoided: Math.max(0, Math.floor(safeNumber(source.totalTrapsAvoided))),
    totalPurpleCompletions: Math.max(0, Math.floor(safeNumber(source.totalPurpleCompletions))),
  };
}

export function saveStats(stats: LifetimeStats) {
  write(STATS_KEY, {
    ...stats,
    fastestReaction:
      stats.fastestReaction !== null && Number.isFinite(stats.fastestReaction)
        ? stats.fastestReaction
        : null,
  });
}
