import { beforeEach, describe, expect, it } from "vitest";
import {
  BACKUP_FORMAT,
  SETTINGS_KEY,
  applyImport,
  exportProgress,
  exportProgressText,
  resetLocalProgress,
  validateImport,
} from "../backup";
import { KEYS, loadProgress, writeJson } from "../progressStore";
import { TUTORIAL_STEPS, TUTORIAL_XP } from "../tutorial";

function seedProfile() {
  const snapshot = loadProgress();
  writeJson(KEYS.profile, { ...snapshot.profile, level: 7, lifetimeXp: 4321 });
  writeJson(KEYS.statistics, { ...snapshot.statistics, gamesPlayed: 42 });
}

describe("progress backup", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("exports a document that validates as an importable backup", () => {
    seedProfile();
    const check = validateImport(exportProgressText("1.0.0"));
    expect(check.ok).toBe(true);
    if (!check.ok) return;
    expect(check.document.format).toBe(BACKUP_FORMAT);
    expect(check.summary.level).toBe(7);
    expect(check.summary.lifetimeXp).toBe(4321);
    expect(check.summary.gamesPlayed).toBe(42);
  });

  it("rejects junk, foreign documents and newer format versions", () => {
    expect(validateImport("not json").ok).toBe(false);
    expect(validateImport(JSON.stringify({ format: "something-else" })).ok).toBe(false);
    const doc = exportProgress("1.0.0");
    expect(validateImport(JSON.stringify({ ...doc, formatVersion: 99 })).ok).toBe(false);
    expect(validateImport(JSON.stringify({ ...doc, data: { unrelated: 1 } })).ok).toBe(false);
  });

  it("restores an exported profile after a full reset", () => {
    seedProfile();
    const text = exportProgressText("1.0.0");
    resetLocalProgress(false);
    expect(loadProgress().profile.level).toBe(1);

    const check = validateImport(text);
    expect(check.ok).toBe(true);
    if (!check.ok) return;
    expect(applyImport(check.document).ok).toBe(true);
    expect(loadProgress().profile.level).toBe(7);
    expect(loadProgress().statistics.gamesPlayed).toBe(42);
  });

  it("keeps settings when asked and clears them otherwise", () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ sound: false }));
    resetLocalProgress(true);
    expect(window.localStorage.getItem(SETTINGS_KEY)).not.toBeNull();
    resetLocalProgress(false);
    expect(window.localStorage.getItem(SETTINGS_KEY)).toBeNull();
  });
});

describe("tutorial definition", () => {
  it("teaches each target type in order and pays a fixed reward", () => {
    expect(TUTORIAL_XP).toBe(50);
    const colors = TUTORIAL_STEPS.map((s) => s.color);
    expect(colors.slice(0, 3)).toEqual(["green", "red", "gold"]);
    expect(new Set(colors)).toEqual(new Set(["green", "red", "gold", "purple"]));
    expect(TUTORIAL_STEPS.every((s) => s.title && s.instruction)).toBe(true);
  });
});

describe("tutorial reward is one-time", () => {
  beforeEach(() => window.localStorage.clear());

  it("marks the profile flags so replays award nothing", () => {
    const snapshot = loadProgress();
    expect(snapshot.profile.tutorialCompleted).toBe(false);
    expect(snapshot.profile.tutorialRewardClaimed).toBe(false);
    writeJson(KEYS.profile, {
      ...snapshot.profile,
      tutorialCompleted: true,
      tutorialRewardClaimed: true,
    });
    const reloaded = loadProgress();
    expect(reloaded.profile.tutorialCompleted).toBe(true);
    expect(reloaded.profile.tutorialRewardClaimed).toBe(true);
  });
});
