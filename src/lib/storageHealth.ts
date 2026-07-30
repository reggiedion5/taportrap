/**
 * Storage availability and health.
 *
 * localStorage stays the primary persistence layer inside the Capacitor
 * WebView. This module answers three questions: is it usable, is the stored
 * data valid, and (for development only) what does it currently contain.
 */

import { KEYS } from "@/game/progressStore";
import { STORAGE_VERSION } from "@/game/progressionTypes";

const PREFERENCE_KEYS = ["tap-or-trap-preferences-v2"] as const;

export type StorageAvailability = "available" | "unavailable";

let cached: StorageAvailability | null = null;

export function checkStorageAvailability(): StorageAvailability {
  if (cached) return cached;
  if (typeof window === "undefined") return "unavailable";
  try {
    const probe = "tap-or-trap-probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    cached = "available";
  } catch {
    cached = "unavailable";
  }
  return cached;
}

export const storageAvailable = () => checkStorageAvailability() === "available";

/** Writes JSON, reporting quota or serialisation failures instead of throwing. */
export function safeWrite(key: string, value: unknown): boolean {
  if (!storageAvailable()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export interface StorageDebugSummary {
  storageVersion: number;
  available: boolean;
  keys: { key: string; present: boolean; valid: boolean; bytes: number }[];
  migrated: boolean;
}

/**
 * Development-only diagnostic. Contains no personal or device-identifying
 * information and is never rendered in the production UI.
 */
export function storageDebugSummary(): StorageDebugSummary {
  const available = storageAvailable();
  const allKeys = [...Object.values(KEYS), ...PREFERENCE_KEYS];

  const keys = allKeys.map((key) => {
    let present = false;
    let valid = false;
    let bytes = 0;
    if (available) {
      try {
        const raw = window.localStorage.getItem(key);
        present = raw !== null;
        bytes = raw?.length ?? 0;
        if (raw !== null) {
          if (key === KEYS.migrated) {
            valid = raw === "1";
          } else {
            JSON.parse(raw);
            valid = true;
          }
        }
      } catch {
        valid = false;
      }
    }
    return { key, present, valid, bytes };
  });

  let migrated = false;
  try {
    migrated = available && window.localStorage.getItem(KEYS.migrated) === "1";
  } catch {
    migrated = false;
  }

  return { storageVersion: STORAGE_VERSION, available, keys, migrated };
}
