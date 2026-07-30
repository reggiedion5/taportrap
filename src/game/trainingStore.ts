/**
 * Versioned persistence for Zen Mode and Reflex Trainer.
 *
 * Training data lives in its own key so it can be reset independently of
 * competitive progress, and so a competitive reset can never delete it.
 */

import { isGameMode, type GameMode } from "./modes";
import {
  TRAINING_MODULES,
  TRAINING_STORAGE_VERSION,
  type TrainerModuleStatistics,
  type TrainerStatistics,
  type TrainingModule,
  type TrainingStore,
  type ZenStatistics,
} from "./trainingTypes";

export const TRAINING_KEY = "tap-or-trap-training-v1";

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function int(value: unknown, fallback = 0): number {
  return Math.max(0, Math.floor(num(value, fallback)));
}

function ratio(value: unknown): number {
  const n = num(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function optionalMs(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function emptyZenStatistics(): ZenStatistics {
  return {
    sessionsCompleted: 0,
    totalTaps: 0,
    longestSessionMs: 0,
    longestStreak: 0,
    bestTapCount: 0,
    totalPlayTime: 0,
    kidsAssistSessions: 0,
  };
}

export function emptyTrainerModuleStatistics(): TrainerModuleStatistics {
  return {
    sessions: 0,
    targetsPracticed: 0,
    correct: 0,
    mistakes: 0,
    bestAccuracy: 0,
    bestAvgReaction: null,
    fastestReaction: null,
    totalTime: 0,
    firstRewardClaimed: false,
  };
}

function emptyModuleMap(): Record<TrainingModule, TrainerModuleStatistics> {
  return {
    green: emptyTrainerModuleStatistics(),
    red: emptyTrainerModuleStatistics(),
    gold: emptyTrainerModuleStatistics(),
    purple: emptyTrainerModuleStatistics(),
    mixed: emptyTrainerModuleStatistics(),
  };
}

export function emptyTrainerStatistics(): TrainerStatistics {
  return {
    sessions: 0,
    totalTargets: 0,
    totalCorrect: 0,
    totalTime: 0,
    modules: emptyModuleMap(),
    trainingDayClaimed: false,
  };
}

export function defaultTrainingStore(): TrainingStore {
  return {
    version: TRAINING_STORAGE_VERSION,
    zen: emptyZenStatistics(),
    trainer: emptyTrainerStatistics(),
    lastCompetitiveMode: "classic",
  };
}

function parseModule(raw: unknown): TrainerModuleStatistics {
  const src = asRecord(raw);
  return {
    sessions: int(src.sessions),
    targetsPracticed: int(src.targetsPracticed),
    correct: int(src.correct),
    mistakes: int(src.mistakes),
    bestAccuracy: ratio(src.bestAccuracy),
    bestAvgReaction: optionalMs(src.bestAvgReaction),
    fastestReaction: optionalMs(src.fastestReaction),
    totalTime: int(src.totalTime),
    firstRewardClaimed: bool(src.firstRewardClaimed),
  };
}

export function parseTrainingStore(raw: unknown): TrainingStore {
  const src = asRecord(raw);
  const zenSrc = asRecord(src.zen);
  const trainerSrc = asRecord(src.trainer);
  const modulesSrc = asRecord(trainerSrc.modules);
  const modules = emptyModuleMap();
  for (const id of TRAINING_MODULES) {
    modules[id] = parseModule(modulesSrc[id]);
  }
  const lastCompetitive = src.lastCompetitiveMode;
  return {
    version: TRAINING_STORAGE_VERSION,
    zen: {
      sessionsCompleted: int(zenSrc.sessionsCompleted),
      totalTaps: int(zenSrc.totalTaps),
      longestSessionMs: int(zenSrc.longestSessionMs),
      longestStreak: int(zenSrc.longestStreak),
      bestTapCount: int(zenSrc.bestTapCount),
      totalPlayTime: int(zenSrc.totalPlayTime),
      kidsAssistSessions: int(zenSrc.kidsAssistSessions),
    },
    trainer: {
      sessions: int(trainerSrc.sessions),
      totalTargets: int(trainerSrc.totalTargets),
      totalCorrect: int(trainerSrc.totalCorrect),
      totalTime: int(trainerSrc.totalTime),
      modules,
      trainingDayClaimed: bool(trainerSrc.trainingDayClaimed),
    },
    lastCompetitiveMode: (isGameMode(lastCompetitive) ? lastCompetitive : "classic") as GameMode,
  };
}

export function loadTrainingStore(): TrainingStore {
  if (typeof window === "undefined") return defaultTrainingStore();
  try {
    const raw = window.localStorage.getItem(TRAINING_KEY);
    if (!raw) return defaultTrainingStore();
    return parseTrainingStore(JSON.parse(raw));
  } catch {
    return defaultTrainingStore();
  }
}

export function saveTrainingStore(store: TrainingStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRAINING_KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable — never crash */
  }
}

/**
 * Clears training records while preserving reward-claim flags, so a player
 * cannot farm the one-off module XP by resetting.
 */
export function resetTrainingRecords(previous: TrainingStore): TrainingStore {
  const fresh = defaultTrainingStore();
  fresh.lastCompetitiveMode = previous.lastCompetitiveMode;
  fresh.trainer.trainingDayClaimed = previous.trainer.trainingDayClaimed;
  for (const id of TRAINING_MODULES) {
    fresh.trainer.modules[id].firstRewardClaimed = previous.trainer.modules[id].firstRewardClaimed;
  }
  saveTrainingStore(fresh);
  return fresh;
}
