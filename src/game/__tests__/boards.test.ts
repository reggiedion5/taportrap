import { describe, expect, it } from "vitest";
import {
  BOARDS,
  DEFAULT_BOARD_ID,
  boardById,
  boardUnlockProgress,
  emptyBoardContext,
  evaluateBoardUnlocks,
  isBoardUnlocked,
  nextBoardHint,
} from "../boards";

describe("board collection", () => {
  it("ships 15 boards with unique ids", () => {
    expect(BOARDS).toHaveLength(15);
    expect(new Set(BOARDS.map((b) => b.id)).size).toBe(15);
  });

  it("unlocks only the starter boards on a fresh profile", () => {
    const unlocked = evaluateBoardUnlocks(emptyBoardContext());
    expect(unlocked).toContain(DEFAULT_BOARD_ID);
    expect(unlocked).toHaveLength(3);
  });

  it("unlocks boards when their requirement is met", () => {
    const ctx = { ...emptyBoardContext(), level: 4, totalGold: 100 };
    expect(isBoardUnlocked(boardById("lava-rush"), ctx)).toBe(true);
    expect(isBoardUnlocked(boardById("desert-mirage"), ctx)).toBe(true);
    expect(isBoardUnlocked(boardById("hyperdrive"), ctx)).toBe(false);
  });

  it("clamps unlock progress to the target", () => {
    const ctx = { ...emptyBoardContext(), gamesPlayed: 999 };
    const progress = boardUnlockProgress(boardById("rain-city"), ctx);
    expect(progress).toEqual({ value: 25, target: 25, ratio: 1 });
  });

  it("returns no progress for default boards", () => {
    expect(boardUnlockProgress(boardById(DEFAULT_BOARD_ID), emptyBoardContext())).toBeNull();
  });

  it("falls back to the default board for unknown ids", () => {
    expect(boardById("does-not-exist").id).toBe(DEFAULT_BOARD_ID);
  });

  it("hints at the closest locked board", () => {
    const ctx = { ...emptyBoardContext(), level: 3 };
    expect(nextBoardHint(ctx)).toContain("Lava Rush");
  });

  it("has a hint of null once everything is unlocked", () => {
    const ctx = {
      level: 99,
      dailyCompleted: 99,
      dailyStreak: 99,
      achievementsUnlocked: 99,
      gamesPlayed: 999,
      bestCombo: 99,
      perfectCount: 999,
      totalGold: 999,
      totalTrapsAvoided: 999,
      totalPurpleCompletions: 999,
      bestScore: 999,
    };
    expect(evaluateBoardUnlocks(ctx)).toHaveLength(15);
    expect(nextBoardHint(ctx)).toBeNull();
  });
});
