import { GAME_MODES, isGameMode, type GameMode } from "./modes";
import { DIFFICULTIES, isDifficulty } from "./difficulty";
import {
  generateDailyChallenge,
  isValidDateString,
  localDateString,
  normalizeStreak,
} from "./daily";
import { DEFAULT_BOARD_ID, isBoardId } from "./boards";
import {
  STORAGE_VERSION,
  type AchievementStore,
  type DailyState,
  type ModeStatistics,
  type PersonalRecords,
  type PlayerProfile,
  type PlayerStatistics,
  type PostGameMission,
} from "./progressionTypes";

export const KEYS = {
  profile: "tap-or-trap-profile-v2",
  statistics: "tap-or-trap-statistics-v2",
  achievements: "tap-or-trap-achievements-v2",
  daily: "tap-or-trap-daily-v2",
  records: "tap-or-trap-records-v2",
  mission: "tap-or-trap-mission-v2",
  migrated: "tap-or-trap-migrated-v2",
} as const;

const LEGACY_STATS_KEY = "tap-or-trap-stats-v1";
const LEGACY_HIGH_SCORE_KEY = "tap-or-trap-high-score-v1";

/* ---------------- safe primitives ---------------- */

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function int(value: unknown, fallback = 0): number {
  return Math.max(0, Math.floor(num(value, fallback)));
}

function optionalMs(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readJson(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — never crash */
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/* ---------------- defaults ---------------- */

export function emptyModeStats(): ModeStatistics {
  return {
    gamesPlayed: 0,
    highScore: 0,
    totalScore: 0,
    totalSuccessfulReactions: 0,
    bestCombo: 0,
    totalReactionTime: 0,
    reactionSampleCount: 0,
    fastestReaction: null,
    bestAvgReaction: null,
    perfectCount: 0,
    fastCount: 0,
    goodCount: 0,
    bestPerfectInRun: 0,
    longestRun: 0,
    totalPlayTime: 0,
    overReasons: {},
  };
}

function emptyModeMap(): Record<GameMode, ModeStatistics> {
  return {
    classic: emptyModeStats(),
    blitz: emptyModeStats(),
    survival: emptyModeStats(),
    focus: emptyModeStats(),
  };
}

export function defaultProfile(): PlayerProfile {
  const now = Date.now();
  return {
    version: STORAGE_VERSION,
    level: 1,
    currentXp: 0,
    lifetimeXp: 0,
    selectedBoardId: DEFAULT_BOARD_ID,
    seenBoardIds: [],
    selectedMode: "classic",
    selectedDifficulty: "standard",
    onboardingCompleted: false,
    seenModeIntros: [],
    createdAt: now,
    lastPlayedAt: now,
    lastOpenedDate: localDateString(),
    totalAchievementsUnlocked: 0,
  };
}

export function defaultStatistics(): PlayerStatistics {
  return {
    version: STORAGE_VERSION,
    gamesPlayed: 0,
    totalScore: 0,
    totalSuccessfulReactions: 0,
    bestCombo: 0,
    totalReactionTime: 0,
    reactionSampleCount: 0,
    fastestReaction: null,
    perfectCount: 0,
    fastCount: 0,
    goodCount: 0,
    totalGold: 0,
    totalTrapsAvoided: 0,
    totalPurpleCompletions: 0,
    totalPlayTime: 0,
    modes: emptyModeMap(),
  };
}

export function emptyDifficultyBests(): PersonalRecords["highScoreByDifficulty"] {
  const out = {} as PersonalRecords["highScoreByDifficulty"];
  for (const mode of GAME_MODES) {
    out[mode] = { beginner: 0, standard: 0, expert: 0 };
  }
  return out;
}

export function defaultRecords(): PersonalRecords {
  return {
    version: STORAGE_VERSION,
    highScore: { classic: 0, blitz: 0, survival: 0, focus: 0 },
    highScoreByDifficulty: emptyDifficultyBests(),
    bestCombo: 0,
    fastestReaction: null,
    bestAvgReaction: null,
    mostPerfectInRun: 0,
    mostGoldInRun: 0,
    mostTrapsAvoidedInRun: 0,
    mostPurpleInRun: 0,
    longestSurvivalRun: 0,
    focusTunnelVision: false,
  };
}

export function defaultAchievements(): AchievementStore {
  return { version: STORAGE_VERSION, unlocked: {} };
}

export function defaultDaily(date = localDateString()): DailyState {
  return {
    version: STORAGE_VERSION,
    currentDate: date,
    challengeId: generateDailyChallenge(date).id,
    progress: 0,
    completed: false,
    rewardClaimed: false,
    completedDate: null,
    currentStreak: 0,
    bestStreak: 0,
    lastCompletedDate: null,
    totalCompleted: 0,
  };
}

/* ---------------- parsing ---------------- */

function parseProfile(raw: unknown): PlayerProfile {
  const src = asRecord(raw);
  const base = defaultProfile();
  // legacy profiles stored the equipped look under `selectedTheme`
  const legacyTheme = typeof src.selectedTheme === "string" ? src.selectedTheme : "";
  const board = isBoardId(src.selectedBoardId)
    ? src.selectedBoardId
    : isBoardId(legacyTheme)
      ? legacyTheme
      : DEFAULT_BOARD_ID;
  const seenBoards = Array.isArray(src.seenBoardIds) ? src.seenBoardIds.filter(isBoardId) : [];
  const seen = Array.isArray(src.seenModeIntros) ? src.seenModeIntros.filter(isGameMode) : [];
  return {
    version: STORAGE_VERSION,
    level: Math.max(1, int(src.level, 1) || 1),
    currentXp: int(src.currentXp),
    lifetimeXp: int(src.lifetimeXp),
    selectedBoardId: board,
    seenBoardIds: seenBoards,
    selectedMode: isGameMode(src.selectedMode) ? src.selectedMode : "classic",
    selectedDifficulty: isDifficulty(src.selectedDifficulty) ? src.selectedDifficulty : "standard",
    onboardingCompleted: bool(src.onboardingCompleted),
    seenModeIntros: seen,
    createdAt: int(src.createdAt, base.createdAt) || base.createdAt,
    lastPlayedAt: int(src.lastPlayedAt, base.lastPlayedAt) || base.lastPlayedAt,
    lastOpenedDate: isValidDateString(src.lastOpenedDate)
      ? src.lastOpenedDate
      : base.lastOpenedDate,
    totalAchievementsUnlocked: int(src.totalAchievementsUnlocked),
  };
}

function parseModeStats(raw: unknown): ModeStatistics {
  const src = asRecord(raw);
  const reasons = asRecord(src.overReasons);
  const overReasons: ModeStatistics["overReasons"] = {};
  for (const [key, value] of Object.entries(reasons)) {
    const count = int(value);
    if (count > 0) {
      (overReasons as Record<string, number>)[key] = count;
    }
  }
  return {
    gamesPlayed: int(src.gamesPlayed),
    highScore: int(src.highScore),
    totalScore: int(src.totalScore),
    totalSuccessfulReactions: int(src.totalSuccessfulReactions),
    bestCombo: int(src.bestCombo),
    totalReactionTime: int(src.totalReactionTime),
    reactionSampleCount: int(src.reactionSampleCount),
    fastestReaction: optionalMs(src.fastestReaction),
    bestAvgReaction: optionalMs(src.bestAvgReaction),
    perfectCount: int(src.perfectCount),
    fastCount: int(src.fastCount),
    goodCount: int(src.goodCount),
    bestPerfectInRun: int(src.bestPerfectInRun),
    longestRun: int(src.longestRun),
    totalPlayTime: int(src.totalPlayTime),
    overReasons,
  };
}

function parseStatistics(raw: unknown): PlayerStatistics {
  const src = asRecord(raw);
  const modesSrc = asRecord(src.modes);
  const modes = emptyModeMap();
  for (const mode of GAME_MODES) {
    modes[mode] = parseModeStats(modesSrc[mode]);
  }
  return {
    version: STORAGE_VERSION,
    gamesPlayed: int(src.gamesPlayed),
    totalScore: int(src.totalScore),
    totalSuccessfulReactions: int(src.totalSuccessfulReactions),
    bestCombo: int(src.bestCombo),
    totalReactionTime: int(src.totalReactionTime),
    reactionSampleCount: int(src.reactionSampleCount),
    fastestReaction: optionalMs(src.fastestReaction),
    perfectCount: int(src.perfectCount),
    fastCount: int(src.fastCount),
    goodCount: int(src.goodCount),
    totalGold: int(src.totalGold),
    totalTrapsAvoided: int(src.totalTrapsAvoided),
    totalPurpleCompletions: int(src.totalPurpleCompletions),
    totalPlayTime: int(src.totalPlayTime),
    modes,
  };
}

/** True when the most recently parsed records blob predates per-difficulty bests. */
let legacyRecordsShape = false;
/**
 * Seeds per-difficulty bests for saves written before the field existed.
 * The legacy global best is credited only to the difficulty that was last
 * selected; every other difficulty starts at 0. Never lowers a stored value.
 */
export function migrateDifficultyBests(
  records: PersonalRecords,
  lastPlayedDifficulty: unknown,
): PersonalRecords {
  const difficulty = isDifficulty(lastPlayedDifficulty) ? lastPlayedDifficulty : null;
  if (!difficulty) return records;
  const highScoreByDifficulty = emptyDifficultyBests();
  let changed = false;
  for (const mode of GAME_MODES) {
    for (const id of DIFFICULTIES) {
      highScoreByDifficulty[mode][id] = records.highScoreByDifficulty[mode][id];
    }
    const legacy = records.highScore[mode];
    if (legacy > highScoreByDifficulty[mode][difficulty]) {
      highScoreByDifficulty[mode][difficulty] = legacy;
      changed = true;
    }
  }
  if (!changed) return records;
  return { ...records, highScoreByDifficulty };
}

/**
 * Immutably raises the best score for one mode + difficulty. Unknown difficulty
 * ids fall back to "standard" and other buckets are always preserved.
 */
export function applyDifficultyBest(
  records: PersonalRecords,
  mode: GameMode,
  difficulty: unknown,
  score: number,
): PersonalRecords {
  if (!isGameMode(mode)) return records;
  const id = isDifficulty(difficulty) ? difficulty : "standard";
  const value = int(score);
  const current = records.highScoreByDifficulty[mode]?.[id] ?? 0;
  if (value <= current) return records;
  return {
    ...records,
    highScoreByDifficulty: {
      ...records.highScoreByDifficulty,
      [mode]: { ...records.highScoreByDifficulty[mode], [id]: value },
    },
  };
}



function parseRecords(raw: unknown): PersonalRecords {
  const src = asRecord(raw);
  const high = asRecord(src.highScore);
  const base = defaultRecords();
  const byDifficulty = asRecord(src.highScoreByDifficulty);
  const isLegacy = src.highScoreByDifficulty === undefined;
  for (const mode of GAME_MODES) {
    base.highScore[mode] = int(high[mode]);
    const modeBests = asRecord(byDifficulty[mode]);
    for (const difficulty of DIFFICULTIES) {
      base.highScoreByDifficulty[mode][difficulty] = int(modeBests[difficulty]);
    }
  }
  legacyRecordsShape = isLegacy;

  return {
    ...base,
    bestCombo: int(src.bestCombo),
    fastestReaction: optionalMs(src.fastestReaction),
    bestAvgReaction: optionalMs(src.bestAvgReaction),
    mostPerfectInRun: int(src.mostPerfectInRun),
    mostGoldInRun: int(src.mostGoldInRun),
    mostTrapsAvoidedInRun: int(src.mostTrapsAvoidedInRun),
    mostPurpleInRun: int(src.mostPurpleInRun),
    longestSurvivalRun: int(src.longestSurvivalRun),
    focusTunnelVision: bool(src.focusTunnelVision),
  };
}

function parseAchievements(raw: unknown): AchievementStore {
  const src = asRecord(raw);
  const unlockedSrc = asRecord(src.unlocked);
  const unlocked: Record<string, number> = {};
  for (const [id, at] of Object.entries(unlockedSrc)) {
    const stamp = int(at);
    unlocked[id] = stamp > 0 ? stamp : Date.now();
  }
  return { version: STORAGE_VERSION, unlocked };
}

function parseDaily(raw: unknown): DailyState {
  const src = asRecord(raw);
  const today = localDateString();
  const base = defaultDaily(today);
  const storedDate = isValidDateString(src.currentDate) ? src.currentDate : today;
  const lastCompleted = isValidDateString(src.lastCompletedDate) ? src.lastCompletedDate : null;

  let state: DailyState = {
    version: STORAGE_VERSION,
    currentDate: storedDate,
    challengeId:
      typeof src.challengeId === "string" && src.challengeId
        ? src.challengeId
        : generateDailyChallenge(storedDate).id,
    progress: Math.max(0, num(src.progress)),
    completed: bool(src.completed),
    rewardClaimed: bool(src.rewardClaimed),
    completedDate: isValidDateString(src.completedDate) ? src.completedDate : null,
    currentStreak: int(src.currentStreak),
    bestStreak: int(src.bestStreak),
    lastCompletedDate: lastCompleted,
    totalCompleted: int(src.totalCompleted),
  };

  if (state.currentDate !== today) {
    state = {
      ...state,
      currentDate: today,
      challengeId: generateDailyChallenge(today).id,
      progress: 0,
      completed: false,
      rewardClaimed: false,
      completedDate: null,
    };
  }
  state = normalizeStreak(state, today);
  state.bestStreak = Math.max(state.bestStreak, state.currentStreak);
  return { ...base, ...state };
}

function parseMission(raw: unknown): PostGameMission | null {
  const src = asRecord(raw);
  if (!isGameMode(src.mode) || typeof src.label !== "string") return null;
  const metric = src.metric;
  const allowed = [
    "score",
    "combo",
    "perfect",
    "traps",
    "gold",
    "purple",
    "successes",
    "avgReaction",
  ];
  if (typeof metric !== "string" || !allowed.includes(metric)) return null;
  return {
    id: typeof src.id === "string" ? src.id : `${src.mode}:${metric}`,
    mode: src.mode,
    label: src.label,
    target: Math.max(1, int(src.target, 1)),
    metric: metric as PostGameMission["metric"],
    lowerIsBetter: bool(src.lowerIsBetter),
    attempts: int(src.attempts),
  };
}

/* ---------------- migration ---------------- */

/** One-time import of Phase 2 data. Never destroys the legacy keys. */
function migrateLegacy(
  stats: PlayerStatistics,
  records: PersonalRecords,
): { stats: PlayerStatistics; records: PersonalRecords } {
  if (typeof window === "undefined") return { stats, records };
  if (window.localStorage.getItem(KEYS.migrated) === "1") {
    return { stats, records };
  }

  const legacyStats = asRecord(readJson(LEGACY_STATS_KEY));
  const legacyHigh = int(readJson(LEGACY_HIGH_SCORE_KEY));

  const nextStats: PlayerStatistics = {
    ...stats,
    gamesPlayed: Math.max(stats.gamesPlayed, int(legacyStats.gamesPlayed)),
    totalSuccessfulReactions: Math.max(
      stats.totalSuccessfulReactions,
      int(legacyStats.totalCorrect),
    ),
    bestCombo: Math.max(stats.bestCombo, int(legacyStats.bestCombo)),
    totalGold: Math.max(stats.totalGold, int(legacyStats.totalGold)),
    totalTrapsAvoided: Math.max(stats.totalTrapsAvoided, int(legacyStats.totalTrapsAvoided)),
    totalPurpleCompletions: Math.max(
      stats.totalPurpleCompletions,
      int(legacyStats.totalPurpleCompletions),
    ),
    fastestReaction: (() => {
      const legacy = optionalMs(legacyStats.fastestReaction);
      if (legacy === null) return stats.fastestReaction;
      return stats.fastestReaction === null ? legacy : Math.min(stats.fastestReaction, legacy);
    })(),
  };

  const legacyBest = Math.max(legacyHigh, int(legacyStats.highestScore));
  nextStats.modes = {
    ...nextStats.modes,
    classic: {
      ...nextStats.modes.classic,
      gamesPlayed: Math.max(nextStats.modes.classic.gamesPlayed, int(legacyStats.gamesPlayed)),
      highScore: Math.max(nextStats.modes.classic.highScore, legacyBest),
      bestCombo: Math.max(nextStats.modes.classic.bestCombo, int(legacyStats.bestCombo)),
    },
  };

  const nextRecords: PersonalRecords = {
    ...records,
    highScore: {
      ...records.highScore,
      classic: Math.max(records.highScore.classic, legacyBest),
    },
    bestCombo: Math.max(records.bestCombo, int(legacyStats.bestCombo)),
    fastestReaction: nextStats.fastestReaction,
  };

  try {
    window.localStorage.setItem(KEYS.migrated, "1");
  } catch {
    /* ignore */
  }
  writeJson(KEYS.statistics, nextStats);
  writeJson(KEYS.records, nextRecords);
  return { stats: nextStats, records: nextRecords };
}

/* ---------------- public loaders ---------------- */

export interface ProgressSnapshot {
  profile: PlayerProfile;
  statistics: PlayerStatistics;
  records: PersonalRecords;
  achievements: AchievementStore;
  daily: DailyState;
  mission: PostGameMission | null;
}

export function loadProgress(): ProgressSnapshot {
  const profile = parseProfile(readJson(KEYS.profile));
  const parsedStats = parseStatistics(readJson(KEYS.statistics));
  const parsedRecords = parseRecords(readJson(KEYS.records));
  const wasLegacyShape = legacyRecordsShape;
  const migrated = migrateLegacy(parsedStats, parsedRecords);
  let records = migrated.records;
  if (wasLegacyShape) {
    const seeded = migrateDifficultyBests(records, profile.selectedDifficulty);
    if (seeded !== records) {
      records = seeded;
      writeJson(KEYS.records, records);
    }
  }
  return {
    profile,
    statistics: migrated.stats,
    records,
    achievements: parseAchievements(readJson(KEYS.achievements)),
    daily: parseDaily(readJson(KEYS.daily)),
    mission: parseMission(readJson(KEYS.mission)),
  };
}

/**
 * Deletes every Tap or Trap! key from this device. Irreversible, offline, and
 * scoped to this app's own keys so nothing else in local storage is touched.
 */
export function resetAllLocalData(): void {
  if (typeof window === "undefined") return;
  const keys = [
    ...Object.values(KEYS),
    "tap-or-trap-preferences-v2",
    "tap-or-trap-training-v1",
    "tap-or-trap-reward-ledger-v1",
  ];
  for (const key of keys) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* storage unavailable — nothing to remove */
    }
  }
}

export function resetStatistics(): {
  statistics: PlayerStatistics;
  records: PersonalRecords;
  achievements: AchievementStore;
} {
  const statistics = defaultStatistics();
  const records = defaultRecords();
  const achievements = defaultAchievements();
  writeJson(KEYS.statistics, statistics);
  writeJson(KEYS.records, records);
  writeJson(KEYS.achievements, achievements);
  writeJson(KEYS.mission, null);
  return { statistics, records, achievements };
}

/**
 * Clears daily-challenge progress and streaks only. XP already paid for past
 * days stays paid — the reward ledger is untouched.
 */
export function resetDailyProgress(): DailyState {
  const fresh = defaultDaily();
  writeJson(KEYS.daily, fresh);
  return fresh;
}
