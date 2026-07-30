import { useCallback, useEffect, useState } from "react";
import {
  loadTrainingStore,
  resetTrainingRecords,
  saveTrainingStore,
} from "./trainingStore";
import {
  TRAINER_XP_PER_MODULE,
  TRAINING_DAY_XP,
  ZEN_CONFIG,
} from "./trainingConfig";
import { recordZenXp, zenSessionAlreadyPaid, zenXpRemainingToday } from "./rewardLedger";
import {
  TRAINING_MODULES,
  type TrainerSessionResult,
  type TrainingRewardResult,
  type TrainingStore,
  type ZenSessionResult,
} from "./trainingTypes";

/**
 * Persistence + reward layer for the training modes.
 *
 * Training never writes to competitive statistics, records or achievements.
 * XP is granted through the immutable reward ledger, so resetting training
 * data cannot be used to re-earn it.
 */
export function useTraining(grantXp: (amount: number) => void) {
  const [store, setStore] = useState<TrainingStore>(() => loadTrainingStore());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStore(loadTrainingStore());
    setReady(true);
  }, []);

  const persist = useCallback((next: TrainingStore) => {
    setStore(next);
    saveTrainingStore(next);
  }, []);

  const recordZenSession = useCallback(
    (result: ZenSessionResult): TrainingRewardResult => {
      const reward: TrainingRewardResult = { xpAwarded: 0, reasons: [], newRecords: [] };
      const meaningful =
        result.taps >= ZEN_CONFIG.minTapsToRecord &&
        result.durationMs >= ZEN_CONFIG.minDurationToRecordMs;
      if (!meaningful) return reward;

      const zen = { ...store.zen };
      zen.sessionsCompleted += 1;
      zen.totalTaps += result.taps;
      zen.totalPlayTime += result.durationMs;
      if (result.kidsAssist) zen.kidsAssistSessions += 1;
      if (result.durationMs > zen.longestSessionMs) {
        zen.longestSessionMs = result.durationMs;
        reward.newRecords.push("Longest Zen session");
      }
      if (result.longestStreak > zen.longestStreak) {
        zen.longestStreak = result.longestStreak;
        reward.newRecords.push("Longest Zen streak");
      }
      if (result.taps > zen.bestTapCount) {
        zen.bestTapCount = result.taps;
        reward.newRecords.push("Most Zen taps");
      }

      const eligible =
        result.durationMs >= ZEN_CONFIG.xpSessionSeconds * 1000 &&
        result.taps >= ZEN_CONFIG.xpSessionTaps &&
        !zenSessionAlreadyPaid(result.sessionId);
      if (eligible) {
        const available = zenXpRemainingToday(ZEN_CONFIG.xpDailyCap);
        const amount = Math.min(ZEN_CONFIG.xpPerSession, available);
        if (amount > 0) {
          recordZenXp(result.sessionId, amount);
          grantXp(amount);
          reward.xpAwarded = amount;
          reward.reasons.push({ label: "Zen session", xp: amount });
        }
      }

      persist({ ...store, zen });
      return reward;
    },
    [grantXp, persist, store],
  );

  const recordTrainerSession = useCallback(
    (result: TrainerSessionResult): TrainingRewardResult => {
      const reward: TrainingRewardResult = { xpAwarded: 0, reasons: [], newRecords: [] };
      const modules = { ...store.trainer.modules };
      const current = { ...modules[result.module] };

      current.sessions += 1;
      current.targetsPracticed += result.targetsPresented;
      current.correct += result.correct;
      current.mistakes += result.mistakes;
      current.totalTime += result.durationMs;
      if (result.accuracy > current.bestAccuracy) {
        current.bestAccuracy = result.accuracy;
        reward.newRecords.push("Best accuracy");
      }
      if (
        result.avgReaction !== null &&
        (current.bestAvgReaction === null || result.avgReaction < current.bestAvgReaction)
      ) {
        current.bestAvgReaction = result.avgReaction;
        reward.newRecords.push("Best average reaction");
      }
      if (
        result.fastestReaction !== null &&
        (current.fastestReaction === null || result.fastestReaction < current.fastestReaction)
      ) {
        current.fastestReaction = result.fastestReaction;
      }

      const completedModule = result.targetsPresented > 0 && result.accuracy >= 0.6;
      if (completedModule && !current.firstRewardClaimed) {
        current.firstRewardClaimed = true;
        grantXp(TRAINER_XP_PER_MODULE);
        reward.xpAwarded += TRAINER_XP_PER_MODULE;
        reward.reasons.push({ label: "Module completed", xp: TRAINER_XP_PER_MODULE });
      }

      modules[result.module] = current;

      const trainer = {
        ...store.trainer,
        modules,
        sessions: store.trainer.sessions + 1,
        totalTargets: store.trainer.totalTargets + result.targetsPresented,
        totalCorrect: store.trainer.totalCorrect + result.correct,
        totalTime: store.trainer.totalTime + result.durationMs,
      };

      const allDone = TRAINING_MODULES.every((id) => modules[id].firstRewardClaimed);
      if (allDone && !trainer.trainingDayClaimed) {
        trainer.trainingDayClaimed = true;
        grantXp(TRAINING_DAY_XP);
        reward.xpAwarded += TRAINING_DAY_XP;
        reward.reasons.push({ label: "Training Day — every module", xp: TRAINING_DAY_XP });
      }

      persist({ ...store, trainer });
      return reward;
    },
    [grantXp, persist, store],
  );

  const setLastCompetitiveMode = useCallback(
    (mode: TrainingStore["lastCompetitiveMode"]) => {
      if (store.lastCompetitiveMode === mode) return;
      persist({ ...store, lastCompetitiveMode: mode });
    },
    [persist, store],
  );

  const resetTraining = useCallback(() => {
    setStore(resetTrainingRecords(store));
  }, [store]);

  return {
    ready,
    training: store,
    recordZenSession,
    recordTrainerSession,
    setLastCompetitiveMode,
    resetTraining,
  };
}
