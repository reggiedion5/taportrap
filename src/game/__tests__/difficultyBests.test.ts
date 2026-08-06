import { beforeEach, describe, expect, it } from "vitest";
import {
  KEYS,
  applyDifficultyBest,
  defaultRecords,
  loadProgress,
  migrateDifficultyBests,
} from "@/game/progressStore";
import type { Difficulty } from "@/game/difficulty";

const bests = (records: ReturnType<typeof defaultRecords>) =>
  records.highScoreByDifficulty.classic;

describe("per-difficulty best scores", () => {
  beforeEach(() => window.localStorage.clear());

  it("updates only the difficulty that was played", () => {
    let records = defaultRecords();
    records = applyDifficultyBest(records, "classic", "beginner", 34);
    expect(bests(records)).toEqual({ beginner: 34, standard: 0, expert: 0 });

    records = applyDifficultyBest(records, "classic", "standard", 18);
    expect(bests(records)).toEqual({ beginner: 34, standard: 18, expert: 0 });

    records = applyDifficultyBest(records, "classic", "expert", 7);
    expect(bests(records)).toEqual({ beginner: 34, standard: 18, expert: 7 });
  });

  it("keeps other modes untouched", () => {
    const records = applyDifficultyBest(defaultRecords(), "blitz", "expert", 12);
    expect(records.highScoreByDifficulty.blitz.expert).toBe(12);
    expect(records.highScoreByDifficulty.classic.expert).toBe(0);
  });

  it("never lowers an existing best", () => {
    let records = applyDifficultyBest(defaultRecords(), "classic", "standard", 40);
    const before = records;
    records = applyDifficultyBest(records, "classic", "standard", 12);
    expect(records).toBe(before);
    expect(bests(records).standard).toBe(40);
  });

  it("does not mutate the source records", () => {
    const original = defaultRecords();
    const next = applyDifficultyBest(original, "classic", "expert", 9);
    expect(original.highScoreByDifficulty.classic.expert).toBe(0);
    expect(next).not.toBe(original);
  });

  it("survives invalid difficulty ids by falling back to standard", () => {
    const records = applyDifficultyBest(defaultRecords(), "classic", "impossible", 15);
    expect(bests(records)).toEqual({ beginner: 0, standard: 15, expert: 0 });
    const nan = applyDifficultyBest(defaultRecords(), "classic", undefined, Number.NaN);
    expect(bests(nan)).toEqual({ beginner: 0, standard: 0, expert: 0 });
  });

  it("migrates a legacy save by crediting only the last-played difficulty", () => {
    const legacy = { ...defaultRecords(), highScore: { ...defaultRecords().highScore, classic: 25 } };
    const migrated = migrateDifficultyBests(legacy, "expert" satisfies Difficulty);
    expect(migrated.highScoreByDifficulty.classic).toEqual({
      beginner: 0,
      standard: 0,
      expert: 25,
    });
    expect(migrated.highScore.classic).toBe(25);
  });

  it("defaults to zero when the legacy difficulty is unknown", () => {
    const legacy = { ...defaultRecords(), highScore: { ...defaultRecords().highScore, classic: 25 } };
    const migrated = migrateDifficultyBests(legacy, "not-a-difficulty");
    expect(migrated.highScoreByDifficulty.classic).toEqual({
      beginner: 0,
      standard: 0,
      expert: 0,
    });
  });

  it("seeds and persists per-difficulty bests when loading a legacy save", () => {
    window.localStorage.setItem(
      KEYS.profile,
      JSON.stringify({ selectedDifficulty: "beginner", selectedMode: "classic" }),
    );
    window.localStorage.setItem(
      KEYS.records,
      JSON.stringify({ highScore: { classic: 31, blitz: 0, survival: 0, focus: 0 } }),
    );
    window.localStorage.setItem(KEYS.migrated, "1");

    const loaded = loadProgress();
    expect(loaded.records.highScoreByDifficulty.classic).toEqual({
      beginner: 31,
      standard: 0,
      expert: 0,
    });
    expect(loaded.records.highScore.classic).toBe(31);

    // reload keeps all three values
    const again = loadProgress();
    expect(again.records.highScoreByDifficulty.classic).toEqual({
      beginner: 31,
      standard: 0,
      expert: 0,
    });
  });

  it("defaults safely when storage is missing or corrupted", () => {
    expect(loadProgress().records.highScoreByDifficulty.classic).toEqual({
      beginner: 0,
      standard: 0,
      expert: 0,
    });
    window.localStorage.setItem(KEYS.records, "{not json");
    expect(loadProgress().records.highScoreByDifficulty.expert ?? null).toBeNull();
    expect(loadProgress().records.highScoreByDifficulty.classic.standard).toBe(0);
  });

  it("round-trips all three difficulties through storage", () => {
    let records = defaultRecords();
    records = applyDifficultyBest(records, "classic", "beginner", 34);
    records = applyDifficultyBest(records, "classic", "standard", 18);
    records = applyDifficultyBest(records, "classic", "expert", 7);
    window.localStorage.setItem(KEYS.records, JSON.stringify(records));
    window.localStorage.setItem(KEYS.migrated, "1");

    expect(loadProgress().records.highScoreByDifficulty.classic).toEqual({
      beginner: 34,
      standard: 18,
      expert: 7,
    });
  });
});
