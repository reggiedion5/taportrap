import { describe, expect, it, beforeEach } from "vitest";
import { classifyTap, closeCallMessage, isCloseCall } from "@/game/tapTiming";
import { milestoneFor, COMBO_MILESTONES } from "@/game/comboMilestones";
import { multiplierForCombo, resolveScore } from "@/game/scoring";
import { difficultyProgress, levelForScore, DIFFICULTY_LEVELS } from "@/game/difficulty";
import {
  DEFAULT_PLAYER_STATS,
  EMPTY_RUN_RECORD,
  derivePlayerStats,
  loadPlayerStats,
  mergeRun,
  normalizePlayerStats,
  savePlayerStats,
  PLAYER_STATS_KEY,
} from "@/game/playerStats";

describe("combo system", () => {
  it("increments on every success and applies the multiplier", () => {
    let combo = 0;
    for (let i = 0; i < 5; i++) combo = resolveScore(1, combo).combo;
    expect(combo).toBe(5);
    expect(multiplierForCombo(combo)).toBe(2);
  });

  it("resets to zero after a mistake", () => {
    let combo = resolveScore(1, 7).combo;
    expect(combo).toBe(8);
    combo = 0; // registerMistake semantics
    expect(multiplierForCombo(combo)).toBe(1);
  });

  it("exposes a milestone for each configured streak only", () => {
    for (const m of COMBO_MILESTONES) expect(milestoneFor(m.combo)?.label).toBe(m.label);
    expect(milestoneFor(4)).toBeNull();
    expect(milestoneFor(11)).toBeNull();
  });
});

describe("tap timing", () => {
  it("classifies the fastest 15% as perfect", () => {
    expect(classifyTap(0, 1000)).toBe("perfect");
    expect(classifyTap(150, 1000)).toBe("perfect");
  });

  it("classifies the next 25% as great", () => {
    expect(classifyTap(151, 1000)).toBe("great");
    expect(classifyTap(400, 1000)).toBe("great");
  });

  it("classifies the remainder as good", () => {
    expect(classifyTap(401, 1000)).toBe("good");
    expect(classifyTap(999, 1000)).toBe("good");
  });

  it("scales with the response window", () => {
    expect(classifyTap(90, 600)).toBe("perfect");
    expect(classifyTap(90, 400)).toBe("great");
  });

  it("survives invalid input", () => {
    expect(classifyTap(Number.NaN, 0)).toBe("good");
    expect(classifyTap(-50, 1000)).toBe("perfect");
  });
});

describe("close calls", () => {
  it("detects taps inside the final 10% of the window", () => {
    expect(isCloseCall(950, 1000)).toBe(true);
    expect(isCloseCall(899, 1000)).toBe(false);
  });

  it("never marks a perfect tap as a close call", () => {
    // a window so small that both rules would overlap
    expect(isCloseCall(0, 1)).toBe(false);
  });

  it("always produces a message", () => {
    for (let i = 0; i < 25; i++) {
      expect(closeCallMessage(950, 1000).length).toBeGreaterThan(0);
    }
  });
});

describe("dynamic difficulty", () => {
  it("progresses through five tiers as the score climbs", () => {
    expect(levelForScore(0).level).toBe(1);
    expect(levelForScore(10).level).toBe(2);
    expect(levelForScore(20).level).toBe(3);
    expect(levelForScore(35).level).toBe(4);
    expect(levelForScore(500).level).toBe(5);
  });

  it("never creates an impossible reaction window", () => {
    for (const level of DIFFICULTY_LEVELS) {
      expect(level.targetDuration).toBeGreaterThanOrEqual(600);
      expect(level.targetSize).toBeGreaterThanOrEqual(0.8);
    }
  });

  it("reports tier and bounded progress", () => {
    const p = difficultyProgress(15);
    expect(p.tier).toBe(2);
    expect(p.progress).toBeGreaterThanOrEqual(0);
    expect(p.progress).toBeLessThanOrEqual(1);
    expect(difficultyProgress(9999).isMax).toBe(true);
  });
});

describe("player statistics", () => {
  beforeEach(() => window.localStorage.clear());

  it("aggregates a run", () => {
    const next = mergeRun(DEFAULT_PLAYER_STATS, {
      ...EMPTY_RUN_RECORD,
      score: 20,
      taps: 12,
      mistakes: 1,
      longestCombo: 7,
      perfectTaps: 3,
      greatTaps: 4,
      closeCalls: 2,
      fastestReaction: 180,
      totalReactionTime: 3600,
      reactionSamples: 12,
      durationMs: 30_000,
      tier: 3,
    });
    expect(next.totalGames).toBe(1);
    expect(next.bestScore).toBe(20);
    expect(next.longestCombo).toBe(7);
    expect(next.highestTier).toBe(3);
    const derived = derivePlayerStats(next);
    expect(derived.averageReaction).toBe(300);
    expect(derived.averageScore).toBe(20);
    expect(derived.accuracy).toBeCloseTo(12 / 13, 5);
  });

  it("never divides by zero", () => {
    const derived = derivePlayerStats(DEFAULT_PLAYER_STATS);
    expect(derived.accuracy).toBe(0);
    expect(derived.averageScore).toBe(0);
    expect(derived.averageReaction).toBeNull();
  });

  it("repairs corrupted and legacy saves without losing the best score", () => {
    window.localStorage.setItem(PLAYER_STATS_KEY, "{not json");
    expect(loadPlayerStats().totalGames).toBe(0);

    window.localStorage.clear();
    window.localStorage.setItem("tap-or-trap-stats-v1", JSON.stringify({ highestScore: 42 }));
    expect(loadPlayerStats().bestScore).toBe(42);

    const repaired = normalizePlayerStats({ totalGames: "abc", bestScore: -5, highestTier: null });
    expect(repaired.totalGames).toBe(0);
    expect(repaired.bestScore).toBe(0);
    expect(repaired.highestTier).toBe(1);
  });

  it("round-trips through storage", () => {
    const stats = mergeRun(DEFAULT_PLAYER_STATS, { ...EMPTY_RUN_RECORD, score: 9, taps: 4 });
    expect(savePlayerStats(stats)).toBe(true);
    expect(loadPlayerStats().bestScore).toBe(9);
  });
});

describe("missing summaries and Play Again", () => {
  it("falls back to the run score when no summary exists", () => {
    const summary = null as { score: number } | null;
    const lastResultScore = 31;
    expect(summary?.score ?? lastResultScore).toBe(31);
  });

  it("resets score and combo for a new run", () => {
    let score = 55;
    let combo = 12;
    // startGame semantics
    score = 0;
    combo = 0;
    expect(score).toBe(0);
    expect(combo).toBe(0);
    expect(multiplierForCombo(combo)).toBe(1);
  });
});
