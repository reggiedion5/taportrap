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
  emptyDifficultyBests,
  loadProgress,
  resetAllLocalData,
  resetStatistics,
  resetDailyProgress,
  resetDailyMissions,
  resetPhase3History,
  writeJson,
  applyDifficultyBest,
  type ProgressSnapshot,
} from "./progressStore";
import {
  applyRunToMissions,
  claimMission as claimMissionState,
  claimableMissionCount,
  defaultMissionsState,
  rolloverMissions,
  type DailyMission,
} from "./dailyMissions";
import { applyXp, calculateXpRewards, levelProgress } from "./xp";
import { defaultPhase3State } from "./phase3Store";
import { applyRunToPhase3 } from "./phase3Session";
import {
  BADGES,
  DEFAULT_TITLE_ID,
  TITLES,
  emptyCosmeticContext,
  type CosmeticContext,
} from "./cosmetics";
import { claimLoginReward, loginRewardAvailable } from "./loginRewards";
import { displayedStreak } from "./playStreak";
import {
  claimWeekly,
  claimableWeeklyCount,
  rolloverWeekly,
  weekKeyFor,
} from "./weeklyChallenges";
import {
  markAllRead,
  markRead,
  pushNotifications,
  unreadCount,
  type NotificationInput,
} from "./notifications";
import { favoriteDifficulty, mostUsedBoard } from "./runHistory";
import type { Phase3State, WeeklyChallenge } from "./phase3Types";

import { isDifficulty, type Difficulty } from "./difficulty";
import {
  BOARDS,
  DEFAULT_BOARD_ID,
  boardById,
  evaluateBoardUnlocks,
  isBoardUnlocked,
  nextBoardHint,
  type BoardId,
  type BoardUnlockContext,
} from "./boards";
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
  unlockedBoards: BoardId[];
  modeHighScore: number;
  dailyProgress: { value: number; target: number; completed: boolean } | null;
  missionCompleted: PostGameMission | null;
  mission: PostGameMission | null;
  /** daily missions that reached their target during this run */
  dailyMissionsCompleted: DailyMission[];
  /** daily missions whose progress moved during this run */
  dailyMissionsAdvanced: { mission: DailyMission; value: number }[];
  /** XP waiting to be claimed after this run (missions + achievements) */
  claimableXp: number;
  /** Phase 3 — retention + identity */
  playStreak: number;
  streakXpAwarded: number;
  streakMilestones: number[];
  weeklyCompleted: WeeklyChallenge[];
  unlockedTitleIds: string[];
  unlockedBadgeIds: string[];
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
  },
  achievements: { version: 2, unlocked: {}, claimed: {} },
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
  missions: defaultMissionsState("1970-01-01"),
  mission: null,
  phase3: defaultPhase3State(),
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
  // Mirror of `snapshot` so session recording can compute its result synchronously.
  const snapshotRef = useRef<ProgressSnapshot>(EMPTY_SNAPSHOT);
  snapshotRef.current = snapshot;

  useEffect(() => {
    const loaded = loadProgress();
    const today = localDateString();
    if (loaded.profile.lastOpenedDate !== today) {
      loaded.profile = { ...loaded.profile, lastOpenedDate: today };
      writeJson(KEYS.profile, loaded.profile);
    }
    writeJson(KEYS.daily, loaded.daily);
    loaded.missions = rolloverMissions(loaded.missions, today);
    writeJson(KEYS.dailyMissions, loaded.missions);
    loaded.phase3 = {
      ...loaded.phase3,
      weekly: rolloverWeekly(loaded.phase3.weekly, weekKeyFor(new Date(`${today}T00:00:00`))),
    };
    writeJson(KEYS.phase3, loaded.phase3);

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

  const boardContext = useMemo<BoardUnlockContext>(
    () => ({
      level: level.level,
      dailyCompleted: snapshot.daily.totalCompleted,
      dailyStreak: snapshot.daily.bestStreak,
      achievementsUnlocked: unlockedAchievementCount,
      gamesPlayed: snapshot.statistics.gamesPlayed,
      bestCombo: snapshot.statistics.bestCombo,
      perfectCount: snapshot.statistics.perfectCount,
      totalGold: snapshot.statistics.totalGold,
      totalTrapsAvoided: snapshot.statistics.totalTrapsAvoided,
      totalPurpleCompletions: snapshot.statistics.totalPurpleCompletions,
      bestScore: Math.max(0, ...Object.values(snapshot.records.highScore)),
    }),
    [
      level.level,
      snapshot.daily.totalCompleted,
      snapshot.daily.bestStreak,
      snapshot.statistics,
      snapshot.records.highScore,
      unlockedAchievementCount,
    ],
  );

  const unlockedBoardIds = useMemo(() => evaluateBoardUnlocks(boardContext), [boardContext]);

  const activeBoard = useMemo(() => {
    const selected = boardById(snapshot.profile.selectedBoardId);
    return isBoardUnlocked(selected, boardContext) ? selected : boardById(DEFAULT_BOARD_ID);
  }, [snapshot.profile.selectedBoardId, boardContext]);

  /** Boards unlocked but never opened in the collection yet. */
  const newBoardCount = useMemo(
    () => unlockedBoardIds.filter((id) => !snapshot.profile.seenBoardIds.includes(id)).length,
    [unlockedBoardIds, snapshot.profile.seenBoardIds],
  );

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

  const setDifficulty = useCallback(
    (difficulty: Difficulty) => patchProfile({ selectedDifficulty: difficulty }),
    [patchProfile],
  );

  const setBoard = useCallback(
    (boardId: string) => {
      const board = BOARDS.find((b) => b.id === boardId);
      if (!board || !isBoardUnlocked(board, boardContext)) return;
      patchProfile({ selectedBoardId: board.id });
    },
    [patchProfile, boardContext],
  );

  /** Clears the NEW badge once the collection has been viewed. */
  const markBoardsSeen = useCallback(() => {
    setSnapshot((prev) => {
      const merged = Array.from(new Set([...prev.profile.seenBoardIds, ...unlockedBoardIds]));
      if (merged.length === prev.profile.seenBoardIds.length) return prev;
      const profile = { ...prev.profile, seenBoardIds: merged };
      writeJson(KEYS.profile, profile);
      return { ...prev, profile };
    });
  }, [unlockedBoardIds]);

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
    const freshMissions = resetDailyMissions();
    setSnapshot((prev) => ({ ...prev, daily: fresh, missions: freshMissions }));
  }, []);

  /* ---------------- reward claims ---------------- */

  /** Pays a completed daily mission exactly once. */
  const claimDailyMission = useCallback((missionId: string): number => {
    const prev = snapshotRef.current;
    const { state, xp } = claimMissionState(prev.missions, missionId);
    if (xp <= 0) return 0;
    const applied = applyXp(prev.profile, xp);
    const profile: PlayerProfile = {
      ...prev.profile,
      level: applied.level,
      currentXp: applied.currentXp,
      lifetimeXp: applied.lifetimeXp,
    };
    writeJson(KEYS.dailyMissions, state);
    writeJson(KEYS.profile, profile);
    const next = { ...prev, missions: state, profile };
    snapshotRef.current = next;
    setSnapshot(next);
    return xp;
  }, []);

  /** Pays an unlocked achievement's reward exactly once. */
  const claimAchievement = useCallback((achievementId: string): number => {
    const prev = snapshotRef.current;
    const def = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!def) return 0;
    if (prev.achievements.unlocked[def.id] === undefined) return 0;
    if (prev.achievements.claimed[def.id] !== undefined) return 0;
    const achievements = {
      ...prev.achievements,
      claimed: { ...prev.achievements.claimed, [def.id]: Date.now() },
    };
    const applied = applyXp(prev.profile, def.rewardXp);
    const profile: PlayerProfile = {
      ...prev.profile,
      level: applied.level,
      currentXp: applied.currentXp,
      lifetimeXp: applied.lifetimeXp,
    };
    writeJson(KEYS.achievements, achievements);
    writeJson(KEYS.profile, profile);
    const next = { ...prev, achievements, profile };
    snapshotRef.current = next;
    setSnapshot(next);
    return def.rewardXp;
  }, []);

  /** Claims every pending mission and achievement reward in one pass. */
  const claimAllRewards = useCallback((): number => {
    let total = 0;
    for (const mission of snapshotRef.current.missions.missions) {
      total += claimDailyMission(mission.id);
    }
    for (const a of ACHIEVEMENTS) {
      total += claimAchievement(a.id);
    }
    return total;
  }, [claimDailyMission, claimAchievement]);

  /* ---------------- session recording ---------------- */

  const recordSession = useCallback((result: GameSessionResult): SessionSummary | null => {
    if (processedSessions.current.has(result.sessionId)) return null;
    processedSessions.current.add(result.sessionId);

    let summary: SessionSummary | null = null;

    // Computed synchronously against a ref (NOT inside a setState updater): a
    // state updater runs during the next render, so the summary would still be
    // null when this function returns — which left the game-over screen with
    // nothing to render on slower/differently-scheduled WebViews (iOS).
    const nextSnapshot = ((prev: ProgressSnapshot): ProgressSnapshot => {
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
      // Difficulty is captured at run start and carried on the result, so a
      // difficulty switched after the run cannot claim the record.
      const runDifficulty: Difficulty = isDifficulty(result.difficulty)
        ? result.difficulty
        : isDifficulty(prev.profile.selectedDifficulty)
          ? prev.profile.selectedDifficulty
          : "standard";
      const records = {
        ...applyDifficultyBest(prev.records, mode, runDifficulty, result.score),
        highScore: { ...prev.records.highScore },
      };
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
      const xp = calculateXpRewards({
        result,
        isNewModeHighScore,
        difficulty: runDifficulty,
      });

      /* ---- achievements (unlock now, XP is claimed by the player) ---- */
      const ctx = {
        stats: statistics,
        records,
        daily,
        profile: prev.profile,
      };
      const unlocked = evaluateAchievements(ctx, prev.achievements);
      const achievements = {
        ...prev.achievements,
        unlocked: { ...prev.achievements.unlocked },
        claimed: { ...prev.achievements.claimed },
      };
      const now = Date.now();
      unlocked.forEach((a) => {
        achievements.unlocked[a.id] = now;
      });

      /* ---- daily missions ---- */
      const missionOutcome = applyRunToMissions(prev.missions, result, today);
      const missions = missionOutcome.state;
      const claimableXp =
        missions.missions.reduce((sum, m) => {
          const p = missions.progress[m.id];
          return p?.completed && !p.claimed ? sum + m.rewardXp : sum;
        }, 0) +
        ACHIEVEMENTS.reduce(
          (sum, a) =>
            achievements.unlocked[a.id] !== undefined && achievements.claimed[a.id] === undefined
              ? sum + a.rewardXp
              : sum,
          0,
        );

      const totalXp = xp.total + dailyXp;
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

      /* ---- board unlocks ---- */
      const beforeBoards = evaluateBoardUnlocks({
        level: levelBefore,
        dailyCompleted: prev.daily.totalCompleted,
        dailyStreak: prev.daily.bestStreak,
        achievementsUnlocked: Object.keys(prev.achievements.unlocked).length,
        gamesPlayed: prev.statistics.gamesPlayed,
        bestCombo: prev.statistics.bestCombo,
        perfectCount: prev.statistics.perfectCount,
        totalGold: prev.statistics.totalGold,
        totalTrapsAvoided: prev.statistics.totalTrapsAvoided,
        totalPurpleCompletions: prev.statistics.totalPurpleCompletions,
        bestScore: Math.max(0, ...Object.values(prev.records.highScore)),
      });
      const afterBoards = evaluateBoardUnlocks({
        level: applied.level,
        dailyCompleted: daily.totalCompleted,
        dailyStreak: daily.bestStreak,
        achievementsUnlocked: achievementCount,
        gamesPlayed: statistics.gamesPlayed,
        bestCombo: statistics.bestCombo,
        perfectCount: statistics.perfectCount,
        totalGold: statistics.totalGold,
        totalTrapsAvoided: statistics.totalTrapsAvoided,
        totalPurpleCompletions: statistics.totalPurpleCompletions,
        bestScore: Math.max(0, ...Object.values(records.highScore)),
      });
      const unlockedBoards = afterBoards.filter((id) => !beforeBoards.includes(id));

      /* ---- phase 3: history, streak, weekly, cosmetics ---- */
      const lifetimeCloseCalls =
        prev.phase3.runHistory.reduce((sum, h) => sum + h.closeCalls, 0) +
        (stats.closeCalls ?? 0);
      const bestExpertScore = Object.values(records.highScoreByDifficulty).reduce(
        (best, byDifficulty) => Math.max(best, byDifficulty.expert ?? 0),
        0,
      );
      const cosmetics: CosmeticContext = {
        ...emptyCosmeticContext(),
        perfectCount: statistics.perfectCount,
        bestCombo: statistics.bestCombo,
        closeCalls: lifetimeCloseCalls,
        chaosRuns: prev.phase3.chaosRuns,
        boardsEquipped: prev.phase3.uniqueBoardEquipHistory.length,
        boardsUnlocked: afterBoards.length,
        boardsTotal: BOARDS.length,
        dailyMissionsCompleted: missions.lifetimeCompleted,
        playStreakLongest: prev.phase3.streak.longest,
        gamesPlayed: statistics.gamesPlayed,
        level: applied.level,
        bestScore: Math.max(0, ...Object.values(records.highScore)),
        bestExpertScore,
        loginCyclesCompleted: prev.phase3.login.completedCycles,
      };

      const phase3Outcome = applyRunToPhase3(prev.phase3, {
        result,
        difficulty: runDifficulty,
        boardId: prev.profile.selectedBoardId ?? DEFAULT_BOARD_ID,
        xpEarned: totalXp,
        newBest: isNewModeHighScore,
        dailyMissionsCompleted: missionOutcome.completed.length,
        cosmetics,
        today,
        timestamp: now,
      });

      // Streak milestone XP is paid immediately, on top of the run's XP.
      let phase3 = phase3Outcome.state;
      let finalProfile = profile;
      let levelsGained = applied.levelsGained;
      let grandTotalXp = totalXp;
      if (phase3Outcome.streakXp > 0) {
        const streakApplied = applyXp(profile, phase3Outcome.streakXp);
        finalProfile = {
          ...profile,
          level: streakApplied.level,
          currentXp: streakApplied.currentXp,
          lifetimeXp: streakApplied.lifetimeXp,
        };
        levelsGained += streakApplied.levelsGained;
        grandTotalXp += phase3Outcome.streakXp;
        xp.entries.push({ label: "Play streak", xp: phase3Outcome.streakXp });
      }

      /* ---- notifications for phase 1/2 unlocks ---- */
      const runNotifications: NotificationInput[] = [
        ...unlocked.map((a) => ({
          id: `achievement-${a.id}`,
          kind: "achievement" as const,
          title: "Achievement unlocked",
          body: `${a.name} — claim ${a.rewardXp} XP.`,
          target: "achievements" as const,
        })),
        ...unlockedBoards.map((id) => ({
          id: `board-${id}`,
          kind: "board" as const,
          title: "New board unlocked",
          body: boardById(id).name,
          target: "boards" as const,
        })),
        ...missionOutcome.completed.map((m) => ({
          id: `mission-${today}-${m.id}`,
          kind: "mission" as const,
          title: "Daily mission complete",
          body: `${m.title} — claim ${m.rewardXp} XP.`,
          target: "missions" as const,
        })),
      ];
      if (finalProfile.level > levelBefore) {
        runNotifications.push({
          id: `level-${finalProfile.level}`,
          kind: "level",
          title: `Level ${finalProfile.level}`,
          body: "You levelled up. New boards may be waiting.",
          target: "profile",
        });
      }
      const pushedRun = pushNotifications(
        phase3.notifications,
        phase3.processedNotificationIds,
        runNotifications,
        now,
      );
      phase3 = {
        ...phase3,
        notifications: pushedRun.notifications,
        processedNotificationIds: pushedRun.processedIds,
      };

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

      if (dailyXp > 0) {
        xp.entries.push({ label: "Daily challenge", xp: dailyXp });
      }

      summary = {
        sessionId: result.sessionId,
        result,
        xp: { entries: xp.entries, total: grandTotalXp },
        dailyXp,
        levelBefore,
        levelAfter: finalProfile.level,
        levelsGained,
        newRecords,
        unlockedAchievements: unlocked,
        unlockedBoards,
        modeHighScore: records.highScoreByDifficulty[mode][runDifficulty],
        dailyProgress,
        missionCompleted,
        mission,
        dailyMissionsCompleted: missionOutcome.completed,
        dailyMissionsAdvanced: missionOutcome.advanced,
        claimableXp,
        playStreak: phase3Outcome.streakDays,
        streakXpAwarded: phase3Outcome.streakXp,
        streakMilestones: phase3Outcome.milestoneDays,
        weeklyCompleted: phase3Outcome.weeklyCompleted,
        unlockedTitleIds: phase3Outcome.unlockedTitleIds,
        unlockedBadgeIds: phase3Outcome.unlockedBadgeIds,
      };

      writeJson(KEYS.statistics, statistics);
      writeJson(KEYS.records, records);
      writeJson(KEYS.daily, daily);
      writeJson(KEYS.dailyMissions, missions);
      writeJson(KEYS.achievements, achievements);
      writeJson(KEYS.profile, finalProfile);
      writeJson(KEYS.mission, mission);
      writeJson(KEYS.phase3, phase3);

      return {
        profile: finalProfile,
        statistics,
        records,
        achievements,
        daily,
        missions,
        mission,
        phase3,
      };
    })(snapshotRef.current);

    snapshotRef.current = nextSnapshot;
    setSnapshot(nextSnapshot);

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
    const lockedBoard = BOARDS.find(
      (b) => !isBoardUnlocked(b, boardContext) && b.unlock.kind === "achievements",
    );
    if (lockedBoard && lockedBoard.unlock.kind === "achievements") {
      const left = lockedBoard.unlock.value - unlockedAchievementCount;
      if (left > 0 && left <= 3) {
        return `${left} more achievement${left === 1 ? "" : "s"} unlocks ${lockedBoard.name}.`;
      }
    }
    if (snapshot.daily.currentStreak > 0) {
      return `Your ${snapshot.daily.currentStreak}-day streak is active.`;
    }
    return null;
  }, [hydrated, snapshot.daily, level, boardContext, unlockedAchievementCount]);

  /** Secondary hint shown on the Boards nav tile. */
  const boardHint = useMemo(() => {
    if (!hydrated) return null;
    return nextBoardHint(boardContext);
  }, [hydrated, boardContext]);

  const nearestAchievement = useMemo(() => {
    const open = achievementList
      .filter((a) => !a.unlocked && a.value > 0)
      .sort((a, b) => b.value / b.target - a.value / a.target)[0];
    if (!open) return null;
    const def = ACHIEVEMENTS.find((a) => a.id === open.id);
    return def ? { def, progress: open } : null;
  }, [achievementList]);

  /** Achievements unlocked whose XP reward is still waiting to be collected. */
  const claimableAchievementCount = useMemo(
    () =>
      ACHIEVEMENTS.filter(
        (a) =>
          snapshot.achievements.unlocked[a.id] !== undefined &&
          snapshot.achievements.claimed[a.id] === undefined,
      ).length,
    [snapshot.achievements],
  );

  const claimableMissions = useMemo(
    () => claimableMissionCount(snapshot.missions),
    [snapshot.missions],
  );

  return {
    hydrated,
    profile: snapshot.profile,
    statistics: snapshot.statistics,
    records: snapshot.records,
    daily: snapshot.daily,
    missions: snapshot.missions,
    achievementStore: snapshot.achievements,
    claimableAchievementCount,
    claimableMissions,
    claimableRewardCount: claimableAchievementCount + claimableMissions,
    claimDailyMission,
    claimAchievement,
    claimAllRewards,
    mission: snapshot.mission,

    challenge,
    level,
    achievementList,
    unlockedAchievementCount,
    unlockedBoardIds,
    boardContext,
    activeBoard,
    newBoardCount,
    mode: snapshot.profile.selectedMode,
    difficulty: snapshot.profile.selectedDifficulty ?? "standard",
    modeConfig: MODE_CONFIG[snapshot.profile.selectedMode],
    reminder,
    boardHint,
    nearestAchievement,
    setMode,
    setDifficulty,
    setBoard,
    markBoardsSeen,
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
