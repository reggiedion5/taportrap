/**
 * Immutable local reward ledger.
 *
 * Resetting daily-challenge progress or training statistics must never make an
 * already-paid XP reward claimable again. The ledger records what has actually
 * been paid and is only cleared by a full progress reset.
 */

import { localDateString } from "./daily";

const LEDGER_KEY = "tap-or-trap-reward-ledger-v1";

interface Ledger {
  version: 1;
  /** local dates whose daily-challenge XP has been paid */
  dailyClaimed: string[];
  /** zen XP paid per local date */
  zenXpByDate: Record<string, number>;
  /** zen session ids already rewarded */
  zenSessions: string[];
}

function emptyLedger(): Ledger {
  return { version: 1, dailyClaimed: [], zenXpByDate: {}, zenSessions: [] };
}

function readLedger(): Ledger {
  if (typeof window === "undefined") return emptyLedger();
  try {
    const raw = window.localStorage.getItem(LEDGER_KEY);
    if (!raw) return emptyLedger();
    const parsed = JSON.parse(raw) as Partial<Ledger>;
    const zenXpByDate: Record<string, number> = {};
    for (const [date, value] of Object.entries(parsed.zenXpByDate ?? {})) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) zenXpByDate[date] = Math.floor(n);
    }
    return {
      version: 1,
      dailyClaimed: Array.isArray(parsed.dailyClaimed)
        ? parsed.dailyClaimed.filter((d): d is string => typeof d === "string").slice(-400)
        : [],
      zenXpByDate,
      zenSessions: Array.isArray(parsed.zenSessions)
        ? parsed.zenSessions.filter((d): d is string => typeof d === "string").slice(-200)
        : [],
    };
  } catch {
    return emptyLedger();
  }
}

function writeLedger(ledger: Ledger) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
  } catch {
    /* storage unavailable — never crash */
  }
}

/* ---------------- daily challenge ---------------- */

export function dailyRewardAlreadyPaid(date: string): boolean {
  return readLedger().dailyClaimed.includes(date);
}

export function markDailyRewardPaid(date: string) {
  const ledger = readLedger();
  if (ledger.dailyClaimed.includes(date)) return;
  ledger.dailyClaimed = [...ledger.dailyClaimed, date].slice(-400);
  writeLedger(ledger);
}

/* ---------------- zen ---------------- */

/** XP still claimable from Zen sessions today. */
export function zenXpRemainingToday(cap: number, date = localDateString()): number {
  const paid = readLedger().zenXpByDate[date] ?? 0;
  return Math.max(0, cap - paid);
}

export function zenSessionAlreadyPaid(sessionId: string): boolean {
  return readLedger().zenSessions.includes(sessionId);
}

export function recordZenXp(sessionId: string, amount: number, date = localDateString()) {
  if (amount <= 0) return;
  const ledger = readLedger();
  if (ledger.zenSessions.includes(sessionId)) return;
  ledger.zenSessions = [...ledger.zenSessions, sessionId].slice(-200);
  ledger.zenXpByDate = {
    ...ledger.zenXpByDate,
    [date]: (ledger.zenXpByDate[date] ?? 0) + Math.floor(amount),
  };
  writeLedger(ledger);
}

/** Only a full progress reset clears the ledger. */
export function clearRewardLedger() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEDGER_KEY);
  } catch {
    /* ignore */
  }
}

export const REWARD_LEDGER_KEY = LEDGER_KEY;
