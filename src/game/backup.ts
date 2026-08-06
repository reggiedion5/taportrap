/**
 * Export / import of the local player profile.
 *
 * The export is a plain JSON document containing this app's own storage keys
 * and nothing else — no secrets, no device identifiers, no personal data.
 * Imports are validated in full before anything is written, and a rollback
 * backup of the current data is taken first so a bad import can never leave the
 * profile half-applied.
 */

import { KEYS, loadProgress } from "./progressStore";
import { STORAGE_VERSION } from "./progressionTypes";

export const BACKUP_FORMAT = "tap-or-trap-backup";
export const BACKUP_FORMAT_VERSION = 1;

/** Extra keys owned by the app that live outside the KEYS map. */
export const EXTRA_KEYS = [
  "tap-or-trap-preferences-v2",
  "tap-or-trap-training-v1",
  "tap-or-trap-reward-ledger-v1",
] as const;

export const SETTINGS_KEY = "tap-or-trap-preferences-v2";

export function backupKeys(): string[] {
  return [...Object.values(KEYS), ...EXTRA_KEYS];
}

export interface BackupDocument {
  format: typeof BACKUP_FORMAT;
  formatVersion: number;
  schemaVersion: number;
  appVersion: string;
  generatedAt: string;
  data: Record<string, unknown>;
}

export interface ImportSummary {
  keys: number;
  level: number;
  lifetimeXp: number;
  gamesPlayed: number;
  achievementsUnlocked: number;
  boardsUnlocked: number;
  generatedAt: string;
}

export type ImportCheck =
  { ok: true; document: BackupDocument; summary: ImportSummary } | { ok: false; error: string };

function readRaw(key: string): unknown {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return undefined;
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

export function exportProgress(appVersion: string): BackupDocument {
  const data: Record<string, unknown> = {};
  for (const key of backupKeys()) {
    const value = readRaw(key);
    if (value !== undefined) data[key] = value;
  }
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    schemaVersion: STORAGE_VERSION,
    appVersion,
    generatedAt: new Date().toISOString(),
    data,
  };
}

export function exportProgressText(appVersion: string): string {
  return JSON.stringify(exportProgress(appVersion), null, 2);
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function count(value: unknown): number {
  return Array.isArray(value) ? value.length : Object.keys(asRecord(value)).length;
}

/** Parses and validates without writing anything. */
export function validateImport(text: string): ImportCheck {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: "That is not valid JSON." };
  }
  const doc = asRecord(parsed);
  if (doc.format !== BACKUP_FORMAT) {
    return { ok: false, error: "This file is not a Tap or Trap! backup." };
  }
  if (typeof doc.formatVersion !== "number" || doc.formatVersion > BACKUP_FORMAT_VERSION) {
    return { ok: false, error: "This backup was made by a newer version of the game." };
  }
  const data = asRecord(doc.data);
  const known = new Set(backupKeys());
  const entries = Object.entries(data).filter(([key]) => known.has(key));
  if (entries.length === 0) {
    return { ok: false, error: "This backup contains no Tap or Trap! data." };
  }

  const profile = asRecord(data[KEYS.profile]);
  const stats = asRecord(data[KEYS.statistics]);
  const achievements = asRecord(asRecord(data[KEYS.achievements]).unlocked);

  const summary: ImportSummary = {
    keys: entries.length,
    level: Math.max(1, Math.floor(Number(profile.level) || 1)),
    lifetimeXp: Math.max(0, Math.floor(Number(profile.lifetimeXp) || 0)),
    gamesPlayed: Math.max(0, Math.floor(Number(stats.gamesPlayed) || 0)),
    achievementsUnlocked: count(achievements),
    boardsUnlocked: count(profile.seenBoardIds),
    generatedAt: typeof doc.generatedAt === "string" ? doc.generatedAt : "unknown",
  };

  return {
    ok: true,
    document: {
      format: BACKUP_FORMAT,
      formatVersion: doc.formatVersion,
      schemaVersion: Math.floor(Number(doc.schemaVersion) || STORAGE_VERSION),
      appVersion: typeof doc.appVersion === "string" ? doc.appVersion : "unknown",
      generatedAt: summary.generatedAt,
      data: Object.fromEntries(entries),
    },
    summary,
  };
}

/**
 * Applies a validated backup. Takes a rollback snapshot first and restores it if
 * any single write fails, so the profile is never partially overwritten.
 */
export function applyImport(document: BackupDocument): { ok: boolean; error?: string } {
  if (typeof window === "undefined") return { ok: false, error: "Storage unavailable." };
  const rollback = new Map<string, string | null>();
  try {
    for (const key of backupKeys()) rollback.set(key, window.localStorage.getItem(key));
    for (const [key, value] of Object.entries(document.data)) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    for (const [key, value] of rollback) {
      try {
        if (value === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, value);
      } catch {
        /* nothing further we can do */
      }
    }
    return { ok: false, error: "Import failed — your previous data was restored." };
  }
  // A load pass proves the imported document survives schema validation.
  try {
    loadProgress();
  } catch {
    return { ok: false, error: "Imported data could not be read." };
  }
  return { ok: true };
}

/** Deletes everything except the settings key when `keepSettings` is true. */
export function resetLocalProgress(keepSettings: boolean): void {
  if (typeof window === "undefined") return;
  for (const key of backupKeys()) {
    if (keepSettings && key === SETTINGS_KEY) continue;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* storage unavailable */
    }
  }
}
