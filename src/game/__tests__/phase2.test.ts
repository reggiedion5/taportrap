import { describe, expect, it } from "vitest";
import {
  applyRunToMissions,
  claimMission,
  claimableMissionCount,
  defaultMissionsState,
  generateDailyMissions,
  isMissionMet,
  rolloverMissions,
} from "../dailyMissions";
import { EMPTY_RUN_STATS } from "../types";
import { applyXp, calculateXpRewards, xpForLevel } from "../xp";
import { defaultProfile } from "../progressStore";
import type { GameSessionResult } from "../progressionTypes";

function run(overrides: Partial<GameSessionResult> = {}): GameSessionResult {
  return {
    sessionId: "s1",
    mode: "classic",
    difficulty: "standard",
    score: 20,
    bestCombo: 10,
    bestMultiplier: 3,
    stats: { ...EMPTY_RUN_STATS, successes: 20, perfect: 4, great: 6, closeCalls: 2, gold: 3 },
    reason: "tapped-trap",
    durationMs: 30_000,
    livesRemaining: null,
    completed: false,
    ...overrides,
  };
}

describe("daily missions", () => {
  it("generates three deterministic missions per date", () => {
    const a = generateDailyMissions("2026-03-04");
    const b = generateDailyMissions("2026-03-04");
    expect(a).toHaveLength(3);
    expect(a).toEqual(b);
    expect(a.map((m) => m.tier)).toEqual(["easy", "medium", "hard"]);
    expect(new Set(a.map((m) => m.category)).size).toBe(3);
  });

  it("changes the set on a new date and rolls progress over once", () => {
    const day1 = defaultMissionsState("2026-03-04");
    const advanced = applyRunToMissions(day1, run(), "2026-03-04").state;
    const day2 = rolloverMissions(advanced, "2026-03-05");
    expect(day2.date).toBe("2026-03-05");
    expect(day2.missions[0].id).not.toBe(day1.missions[0].id);
    expect(Object.values(day2.progress).every((p) => p.value === 0)).toBe(true);
    expect(day2.lifetimeCompleted).toBe(advanced.lifetimeCompleted);
    // rolling over again the same day is a no-op
    expect(rolloverMissions(day2, "2026-03-05")).toBe(day2);
  });

  it("never completes the same mission twice or pays XP twice", () => {
    const state = defaultMissionsState("2026-03-04");
    const easy = state.missions[0];
    const seeded = {
      ...state,
      progress: {
        ...state.progress,
        [easy.id]: { value: easy.target * 5, completed: false, claimed: false },
      },
    };
    const first = applyRunToMissions(seeded, run({ score: 999 }), "2026-03-04");
    expect(first.completed.some((m) => m.id === easy.id)).toBe(true);
    const second = applyRunToMissions(first.state, run({ score: 999 }), "2026-03-04");
    expect(second.completed).toHaveLength(0);

    const claimed = claimMission(first.state, easy.id);
    expect(claimed.xp).toBe(easy.rewardXp);
    expect(claimMission(claimed.state, easy.id).xp).toBe(0);
    expect(claimableMissionCount(claimed.state)).toBe(
      claimableMissionCount(first.state) - 1,
    );
  });

  it("treats lower-is-better targets correctly", () => {
    const [mission] = generateDailyMissions("2026-03-04").filter((m) => m.lowerIsBetter);
    if (!mission) return;
    expect(isMissionMet(mission, 0)).toBe(false);
    expect(isMissionMet(mission, mission.target)).toBe(true);
    expect(isMissionMet(mission, mission.target + 50)).toBe(false);
  });
});

describe("xp", () => {
  it("rewards timing quality on top of reactions", () => {
    const plain = calculateXpRewards({
      result: run({ stats: { ...EMPTY_RUN_STATS, successes: 20, perfect: 4 } }),
      isNewModeHighScore: false,
    });
    const timed = calculateXpRewards({ result: run(), isNewModeHighScore: false });
    expect(timed.total).toBeGreaterThan(plain.total);
  });

  it("levels up without ever looping forever", () => {
    const profile = defaultProfile();
    const applied = applyXp(profile, xpForLevel(1) * 3);
    expect(applied.levelsGained).toBeGreaterThanOrEqual(2);
    expect(applied.currentXp).toBeLessThan(xpForLevel(applied.level));
    expect(applyXp(profile, -50).levelsGained).toBe(0);
  });
});
