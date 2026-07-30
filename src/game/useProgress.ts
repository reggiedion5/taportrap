import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MODE_CONFIG, type GameMode } from "./modes";
import { ACHIEVEMENTS, achievementProgress, evaluateAchievements } from "./achievements";
import {
  DAILY_XP_REWARD,
  advanceStreak,
  challengeRunValue,
  generateDailyChallenge,
  isChallengeMet,
  localDateString,
  mergeChallengeProgress,
} from "./daily";
import {
  KEYS,
  defaultProfile,
  loadProgress,
  resetAllLocalData,
  resetStatistics,
  resetDailyProgress,
  writeJson,
  type ProgressSnapshot,
} from "./progressStore";
import { applyXp, calculateXpRewards, levelProgress } from "./xp";
import {
  DEFAULT_THEME_ID,
  THEMES,
  evaluateThemeUnlocks,
  isThemeUnlocked,
  themeById,
} from "./themes";
import {
  generatePostGameMission,
  isMissionComplete,
  missionRunValue,
  shouldReplaceMission,
} from "./missions";
import type {
  Achievement,
  AchievementProgress,
  DailyChallenge,
  GameSessionResult,
  PersonalRecordKey,
  PlayerProfile,
  PostGameMission,
  XpRewardBreakdown,
} from "./progressionTypes";

export interface SessionSummary {
  sessionId: string;
  result: GameSessionResult;
  xp: XpRewardBreakdown;
  dailyXp: number;
  levelBefore: number;
  levelAfter: number;
  levelsGained: number;
  newRecords: PersonalRecordKey[];
  unlockedAchievements: Achievement[];
  unlockedThemes: string[];
  modeHighScore: number;
  dailyProgress: { value: number; target: number; completed: boolean } | null;
  missionCompleted: PostGameMission | null;
  mission: PostGameMission | null;
}

const EMPTY_SNAPSHOT: ProgressSnapshot = {
  profile: defaultProfile(),
  statistics: {
    version: 2,
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
    modes: {
      classic: emptyMode(),
      blitz: emptyMode(),
      survival: emptyMode(),
      focus: emptyMode(),
    },
  },
  records: {
    version: 2,
    highScore: { classic: 0, blitz: 0, survival: 0, focus: 0 },
    bestCombo: 0,
    fastestReaction: null,
    bestAvgReaction: null,
    mostPerfectInRun: 0,
    mostGoldInRun: 0,
    mostTrapsAvoidedInRun: 0,
    mostPurpleInRun: 0,
    longestSurvivalRun: 0,
    focusTunnelVision: false,
  },
  achievements: { version: 2, unlocked: {} },
  daily: {
    version: 2,
    currentDate: "1970-01-01",
    challengeId: "",
    progress: 0,
    completed: false,
    rewardClaimed: false,
    completedDate: null,
    currentStreak: 0,
    bestStreak: 0,
    lastCompletedDate: null,
    totalCompleted: 0,
  },
  mission: null,
};

function emptyMode() {
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

function betterLow(current: number | null, next: number | null): number | null {
  if (next === null) return current;
  if (current === null) return next;
  return Math.min(current, next);
}

export function useProgress() {
  const [snapshot, setSnapshot] = useState<ProgressSnapshot>(EMPTY_SNAPSHOT);
  const [hydrated, setHydrated] = useState(false);
  const processedSessions = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loaded = loadProgress();
    const today = localDateString();
    if (loaded.profile.lastOpenedDate !== today) {
      loaded.profile = { ...loaded.profile, lastOpenedDate: today };
      writeJson(KEYS.profile, loaded.profile);
    }
    writeJson(KEYS.daily, loaded.daily);
    setSnapshot(loaded);
    setHydrated(true);
  }, []);

  const challenge: DailyChallenge = useMemo(
    () => generateDailyChallenge(snapshot.daily.currentDate),
    [snapshot.daily.currentDate],
  );

  const level = useMemo(() => levelProgress(snapshot.profile), [snapshot.profile]);

  const achievementList: AchievementProgress[] = useMemo(
    () =>
      achievementProgress(
        {
          stats: snapshot.statistics,
          records: snapshot.records,
          daily: snapshot.daily,
          profile: snapshot.profile,
        },
        snapshot.achievements,
      ),
    [snapshot],
  );

  const unlockedAchievementCount = useMemo(
    () => Object.keys(snapshot.achievements.unlocked).length,
    [snapshot.achievements],
  );

  const themeContext = useMemo(
    () => ({
      level: level.level,
      dailyCompleted: snapshot.daily.totalCompleted,
      achievementsUnlocked: unlockedAchievementCount,
    }),
    [level.level, snapshot.daily.totalCompleted, unlockedAchievementCount],
  );

  const unlockedThemeIds = useMemo(() => evaluateThemeUnlocks(themeContext), [themeContext]);

  const activeTheme = useMemo(() => {
    const selected = themeById(snapshot.profile.selectedTheme);
    return isThemeUnlocked(selected, themeContext) ? selected : themeById(DEFAULT_THEME_ID);
  }, [snapshot.profile.selectedTheme, themeContext]);

  /* ---------------- profile mutations ---------------- */

  const patchProfile = useCallback((patch: Partial<PlayerProfile>) => {
    setSnapshot((prev) => {
      const profile = { ...prev.profile, ...patch };
      writeJson(KEYS.profile, profile);
      return { ...prev, profile };
    });
  }, []);

  const setMode = useCallback(
    (mode: GameMode) => patchProfile({ selectedMode: mode }),
    [patchProfile],
  );

  const setTheme = useCallback(
    (themeId: string) => {
      const theme = THEMES.find((t) => t.id === themeId);
      if (!theme || !isThemeUnlocked(theme, themeContext)) return;
      patchProfile({ selectedTheme: theme.id });
    },
    [patchProfile, themeContext],
  );

  const completeOnboarding = useCallback(
    () => patchProfile({ onboardingCompleted: true }),
    [patchProfile],
  );

  const markModeIntroSeen = useCallback((mode: GameMode) => {
    setSnapshot((prev) => {
      if (prev.profile.seenModeIntros.includes(mode)) return prev;
      const profile = {
        ...prev.profile,
        seenModeIntros: [...prev.profile.seenModeIntros, mode],
      };
      writeJson(KEYS.profile, profile);
      return { ...prev, profile };
    });
  }, []);

  /** Grants XP outside of a competitive run (training rewards). */
  const grantXp = useCallback((amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    setSnapshot((prev) => {
      const applied = applyXp(prev.profile, amount);
      const profile = {
        ...prev.profile,
        level: applied.level,
        currentXp: applied.currentXp,
        lifetimeXp: applied.lifetimeXp,
      };
      writeJson(KEYS.profile, profile);
      return { ...prev, profile };
    });
  }, []);

  const clearStatistics = useCallback(() => {
    const fresh = resetStatistics();
    processedSessions.current.clear();
    setSnapshot((prev) => ({
      ...prev,
      statistics: fresh.statistics,
      records: fresh.records,
      achievements: fresh.achievements,
      mission: null,
      profile: (() => {
        const profile = { ...prev.profile, totalAchievementsUnlocked: 0 };
        writeJson(KEYS.profile, profile);
        return profile;
      })(),
    }));
  }, []);

  const clearDailyProgress = useCallback(() => {
    const fresh = resetDailyProgress();
    setSnapshot((prev) => ({ ...prev, daily: fresh }));
  }, []);



  /* ---------------- session recording ---------------- */

  const recordSession = useCallback((result: GameSessionResult): SessionSummary | null => {
    if (processedSessions.current.has(result.sessionId)) return null;
    processedSessions.current.add(result.sessionId);

    let summary: SessionSummary | null = null;

    setSnapshot((prev) => {
      const mode = result.mode;
      const stats = result.stats;
      const prevMode = prev.statistics.modes[mode];
      const avg = stats.avgReaction;

      /* ---- statistics ---- */
      const reactionTotal = avg !== null ? avg * (stats.perfect + stats.fast + stats.good) : 0;
      const samples = stats.perfect + stats.fast + stats.good;

      const nextMode = {
        ...prevMode,
        gamesPlayed: prevMode.gamesPlayed + 1,
        highScore: Math.max(prevMode.highScore, result.score),
        totalScore: prevMode.totalScore + result.score,
        totalSuccessfulReactions: prevMode.totalSuccessfulReactions + stats.successes,
        bestCombo: Math.max(prevMode.bestCombo, result.bestCombo),
        totalReactionTime: prevMode.totalReactionTime + reactionTotal,
        reactionSampleCount: prevMode.reactionSampleCount + samples,
        fastestReaction: betterLow(prevMode.fastestReaction, stats.fastestReaction),
        bestAvgReaction:
          samples >= 5 ? betterLow(prevMode.bestAvgReaction, avg) : prevMode.bestAvgReaction,
        perfectCount: prevMode.perfectCount + stats.perfect,
        fastCount: prevMode.fastCount + stats.fast,
        goodCount: prevMode.goodCount + stats.good,
        bestPerfectInRun: Math.max(prevMode.bestPerfectInRun, stats.perfect),
        longestRun: Math.max(prevMode.longestRun, stats.successes),
        totalPlayTime: prevMode.totalPlayTime + Math.max(0, result.durationMs),
        overReasons: result.reason
          ? {
              ...prevMode.overReasons,
              [result.reason]: (prevMode.overReasons[result.reason] ?? 0) + 1,
            }
          : prevMode.overReasons,
      };

      const statistics = {
        ...prev.statistics,
        gamesPlayed: prev.statistics.gamesPlayed + 1,
        totalScore: prev.statistics.totalScore + result.score,
        totalSuccessfulReactions: prev.statistics.totalSuccessfulReactions + stats.successes,
        bestCombo: Math.max(prev.statistics.bestCombo, result.bestCombo),
        totalReactionTime: prev.statistics.totalReactionTime + reactionTotal,
        reactionSampleCount: prev.statistics.reactionSampleCount + samples,
        fastestReaction: betterLow(prev.statistics.fastestReaction, stats.fastestReaction),
        perfectCount: prev.statistics.perfectCount + stats.perfect,
        fastCount: prev.statistics.fastCount + stats.fast,
        goodCount: prev.statistics.goodCount + stats.good,
        totalGold: prev.statistics.totalGold + stats.gold,
        totalTrapsAvoided: prev.statistics.totalTrapsAvoided + stats.trapsAvoided,
        totalPurpleCompletions: prev.statistics.totalPurpleCompletions + stats.purpleCompletions,
        totalPlayTime: prev.statistics.totalPlayTime + Math.max(0, result.durationMs),
        modes: { ...prev.statistics.modes, [mode]: nextMode },
      };

      /* ---- personal records ---- */
      const newRecords: PersonalRecordKey[] = [];
      const records = { ...prev.records, highScore: { ...prev.records.highScore } };
      if (result.score > records.highScore[mode]) {
        records.highScore[mode] = result.score;
        newRecords.push("score");
      }
      if (result.bestCombo > records.bestCombo) {
        records.bestCombo = result.bestCombo;
        newRecords.push("bestCombo");
      }
      if (
        stats.fastestReaction !== null &&
        (records.fastestReaction === null || stats.fastestReaction < records.fastestReaction)
      ) {
        records.fastestReaction = stats.fastestReaction;
        newRecords.push("fastestReaction");
      }
      if (
        avg !== null &&
        samples >= 5 &&
        (records.bestAvgReaction === null || avg < records.bestAvgReaction)
      ) {
        records.bestAvgReaction = avg;
        newRecords.push("bestAvgReaction");
      }
      if (stats.perfect > records.mostPerfectInRun) {
        records.mostPerfectInRun = stats.perfect;
        newRecords.push("mostPerfectInRun");
      }
      if (stats.gold > records.mostGoldInRun) {
        records.mostGoldInRun = stats.gold;
        newRecords.push("mostGoldInRun");
      }
      if (stats.trapsAvoided > records.mostTrapsAvoidedInRun) {
        records.mostTrapsAvoidedInRun = stats.trapsAvoided;
        newRecords.push("mostTrapsAvoidedInRun");
      }
      if (stats.purpleCompletions > records.mostPurpleInRun) {
        records.mostPurpleInRun = stats.purpleCompletions;
        newRecords.push("mostPurpleInRun");
      }
      if (mode === "survival" && stats.successes > records.longestSurvivalRun) {
        records.longestSurvivalRun = stats.successes;
        newRecords.push("longestSurvivalRun");
      }
      if (mode === "focus" && stats.successes >= 20 && avg !== null && avg < 350) {
        records.focusTunnelVision = true;
      }

      /* ---- daily challenge ---- */
      const today = localDateString();
      let daily = prev.daily;
      if (daily.currentDate !== today) {
        daily = {
          ...daily,
          currentDate: today,
          challengeId: generateDailyChallenge(today).id,
          progress: 0,
          completed: false,
          rewardClaimed: false,
          completedDate: null,
        };
      }
      const todaysChallenge = generateDailyChallenge(daily.currentDate);
      let dailyXp = 0;
      let dailyProgress: SessionSummary["dailyProgress"] = null;
      const runValue = challengeRunValue(todaysChallenge, result);
      if (runValue !== null) {
        const progress = mergeChallengeProgress(todaysChallenge, daily.progress, runValue);
        daily = { ...daily, progress };
        if (!daily.completed && isChallengeMet(todaysChallenge, progress)) {
          daily = {
            ...daily,
            completed: true,
            completedDate: today,
          };
          if (!daily.rewardClaimed) {
            daily = { ...daily, rewardClaimed: true };
            dailyXp = DAILY_XP_REWARD;
            daily = advanceStreak(daily, today);
          }
        }
      }
      dailyProgress = {
        value: daily.progress,
        target: todaysChallenge.target,
        completed: daily.completed,
      };

      /* ---- xp + level ---- */
      const isNewModeHighScore = newRecords.includes("score");
      const xp = calculateXpRewards({ result, isNewModeHighScore });

      /* ---- achievements ---- */
      const ctx = {
        stats: statistics,
        records,
        daily,
        profile: prev.profile,
      };
      const unlocked = evaluateAchievements(ctx, prev.achievements);
      const achievementXp = unlocked.reduce((s, a) => s + a.rewardXp, 0);
      const achievements = {
        ...prev.achievements,
        unlocked: { ...prev.achievements.unlocked },
      };
      const now = Date.now();
      unlocked.forEach((a) => {
        achievements.unlocked[a.id] = now;
      });

      const totalXp = xp.total + dailyXp + achievementXp;
      const levelBefore = prev.profile.level;
      const applied = applyXp(prev.profile, totalXp);
      const achievementCount = Object.keys(achievements.unlocked).length;

      const profile: PlayerProfile = {
        ...prev.profile,
        level: applied.level,
        currentXp: applied.currentXp,
        lifetimeXp: applied.lifetimeXp,
        lastPlayedAt: now,
        totalAchievementsUnlocked: achievementCount,
      };

      /* ---- theme unlocks ---- */
      const beforeThemes = evaluateThemeUnlocks({
        level: levelBefore,
        dailyCompleted: prev.daily.totalCompleted,
        achievementsUnlocked: Object.keys(prev.achievements.unlocked).length,
      });
      const afterThemes = evaluateThemeUnlocks({
        level: applied.level,
        dailyCompleted: daily.totalCompleted,
        achievementsUnlocked: achievementCount,
      });
      const unlockedThemes = afterThemes.filter((id) => !beforeThemes.includes(id));

      /* ---- post-game mission ---- */
      let missionCompleted: PostGameMission | null = null;
      let mission = prev.mission;
      if (mission) {
        const value = missionRunValue(mission, result);
        if (isMissionComplete(mission, value)) {
          missionCompleted = mission;
          mission = null;
        } else {
          mission = { ...mission, attempts: mission.attempts + 1 };
          if (shouldReplaceMission(mission)) mission = null;
        }
      }
      if (!mission || mission.mode !== mode) {
        mission = generatePostGameMission(result);
      }

      if (achievementXp > 0) {
        xp.entries.push({ label: "Achievements", xp: achievementXp });
      }
      if (dailyXp > 0) {
        xp.entries.push({ label: "Daily challenge", xp: dailyXp });
      }

      summary = {
        sessionId: result.sessionId,
        result,
        xp: { entries: xp.entries, total: totalXp },
        dailyXp,
        levelBefore,
        levelAfter: applied.level,
        levelsGained: applied.levelsGained,
        newRecords,
        unlockedAchievements: unlocked,
        unlockedThemes,
        modeHighScore: records.highScore[mode],
        dailyProgress,
        missionCompleted,
        mission,
      };

      writeJson(KEYS.statistics, statistics);
      writeJson(KEYS.records, records);
      writeJson(KEYS.daily, daily);
      writeJson(KEYS.achievements, achievements);
      writeJson(KEYS.profile, profile);
      writeJson(KEYS.mission, mission);

      return {
        profile,
        statistics,
        records,
        achievements,
        daily,
        mission,
      };
    });

    return summary;
  }, []);

  /* ---------------- home-screen reminder ---------------- */

  const reminder = useMemo(() => {
    if (!hydrated) return null;
    if (!snapshot.daily.completed) return "Today's daily challenge is waiting.";
    const xpLeft = level.xpForNext - level.currentXp;
    if (xpLeft <= 60) {
      return `${xpLeft} XP to reach Level ${level.level + 1}.`;
    }
    const lockedTheme = THEMES.find(
      (t) => !isThemeUnlocked(t, themeContext) && t.unlock.kind === "achievements",
    );
    if (lockedTheme && lockedTheme.unlock.kind === "achievements") {
      const left = lockedTheme.unlock.value - unlockedAchievementCount;
      if (left > 0 && left <= 3) {
        return `${left} more achievement${left === 1 ? "" : "s"} unlocks ${lockedTheme.name}.`;
      }
    }
    if (snapshot.daily.currentStreak > 0) {
      return `Your ${snapshot.daily.currentStreak}-day streak is active.`;
    }
    return null;
  }, [hydrated, snapshot.daily, level, themeContext, unlockedAchievementCount]);

  /** Secondary hint shown on the Themes nav tile while a theme is still locked. */
  const themeHint = useMemo(() => {
    if (!hydrated) return null;
    const lockedTheme = THEMES.find(
      (t) => !isThemeUnlocked(t, themeContext) && t.unlock.kind === "achievements",
    );
    if (!lockedTheme || lockedTheme.unlock.kind !== "achievements") return null;
    const left = lockedTheme.unlock.value - unlockedAchievementCount;
    if (left <= 0) return null;
    return `${lockedTheme.name} · ${left} achievement${left === 1 ? "" : "s"} away`;
  }, [hydrated, themeContext, unlockedAchievementCount]);

  const nearestAchievement = useMemo(() => {
    const open = achievementList
      .filter((a) => !a.unlocked && a.value > 0)
      .sort((a, b) => b.value / b.target - a.value / a.target)[0];
    if (!open) return null;
    const def = ACHIEVEMENTS.find((a) => a.id === open.id);
    return def ? { def, progress: open } : null;
  }, [achievementList]);

  return {
    hydrated,
    profile: snapshot.profile,
    statistics: snapshot.statistics,
    records: snapshot.records,
    daily: snapshot.daily,
    mission: snapshot.mission,
    challenge,
    level,
    achievementList,
    unlockedAchievementCount,
    unlockedThemeIds,
    themeContext,
    activeTheme,
    mode: snapshot.profile.selectedMode,
    modeConfig: MODE_CONFIG[snapshot.profile.selectedMode],
    reminder,
    themeHint,
    nearestAchievement,
    setMode,
    setTheme,
    completeOnboarding,
    markModeIntroSeen,
    patchProfile,
    grantXp,
    clearStatistics,
    clearDailyProgress,
    resetAllData: resetAllLocalData,
    recordSession,
  };
}

export type ProgressApi = ReturnType<typeof useProgress>;
