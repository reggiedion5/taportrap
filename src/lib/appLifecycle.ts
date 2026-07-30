/**
 * Unified app-interruption bus.
 *
 * Browser visibility events and Capacitor lifecycle events both feed into this
 * single module so the game can never be paused twice for the same
 * interruption. Listeners are registered once per process and cleaned up when
 * the last subscriber goes away.
 */

import { isNativePlatform, isPluginAvailable } from "./nativePlatform";

export type InterruptionSource =
  | "capacitor-background"
  | "browser-hidden"
  | "manual-pause"
  | "system-interruption";

export interface InterruptionEvent {
  source: InterruptionSource;
  at: number;
}

type Listener = (event: InterruptionEvent) => void;

const backgroundListeners = new Set<Listener>();
const foregroundListeners = new Set<Listener>();
const backButtonListeners = new Set<() => boolean>();

let bound = false;
let unbindNative: (() => void) | null = null;
/** Collapses duplicate signals fired by different APIs for one interruption. */
let lastBackgroundAt = 0;
const DEDUPE_MS = 400;

function emitBackground(source: InterruptionSource) {
  const now = Date.now();
  if (now - lastBackgroundAt < DEDUPE_MS) return;
  lastBackgroundAt = now;
  const event: InterruptionEvent = { source, at: now };
  backgroundListeners.forEach((fn) => {
    try {
      fn(event);
    } catch {
      /* one bad listener must not stop the rest */
    }
  });
}

function emitForeground(source: InterruptionSource) {
  lastBackgroundAt = 0;
  const event: InterruptionEvent = { source, at: Date.now() };
  foregroundListeners.forEach((fn) => {
    try {
      fn(event);
    } catch {
      /* ignore */
    }
  });
}

function handleVisibility() {
  if (document.visibilityState === "hidden") emitBackground("browser-hidden");
  else emitForeground("browser-hidden");
}

function handleBlur() {
  emitBackground("browser-hidden");
}

function handlePageHide() {
  emitBackground("system-interruption");
}

async function bindNative() {
  if (!isNativePlatform() || !isPluginAvailable("App")) return;
  try {
    const mod = await import("@capacitor/app");
    const app = mod.App;
    const stateHandle = await app.addListener("appStateChange", ({ isActive }) => {
      if (isActive) emitForeground("capacitor-background");
      else emitBackground("capacitor-background");
    });
    const pauseHandle = await app.addListener("pause", () => emitBackground("capacitor-background"));
    const resumeHandle = await app.addListener("resume", () =>
      emitForeground("capacitor-background"),
    );
    const backHandle = await app.addListener("backButton", () => {
      // Handlers return true when they consumed the press.
      for (const fn of Array.from(backButtonListeners).reverse()) {
        try {
          if (fn()) return;
        } catch {
          /* ignore */
        }
      }
      void app.exitApp?.();
    });

    unbindNative = () => {
      void stateHandle.remove().catch(() => {});
      void pauseHandle.remove().catch(() => {});
      void resumeHandle.remove().catch(() => {});
      void backHandle.remove().catch(() => {});
    };
  } catch {
    unbindNative = null;
  }
}

function bind() {
  if (bound || typeof document === "undefined") return;
  bound = true;
  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("blur", handleBlur);
  window.addEventListener("pagehide", handlePageHide);
  void bindNative();
}

function unbindIfIdle() {
  if (
    backgroundListeners.size > 0 ||
    foregroundListeners.size > 0 ||
    backButtonListeners.size > 0 ||
    !bound
  ) {
    return;
  }
  bound = false;
  document.removeEventListener("visibilitychange", handleVisibility);
  window.removeEventListener("blur", handleBlur);
  window.removeEventListener("pagehide", handlePageHide);
  unbindNative?.();
  unbindNative = null;
}

export function onAppBackground(listener: Listener): () => void {
  bind();
  backgroundListeners.add(listener);
  return () => {
    backgroundListeners.delete(listener);
    unbindIfIdle();
  };
}

export function onAppForeground(listener: Listener): () => void {
  bind();
  foregroundListeners.add(listener);
  return () => {
    foregroundListeners.delete(listener);
    unbindIfIdle();
  };
}

/** Register a back-button handler. Return true to consume the press. */
export function onBackButton(listener: () => boolean): () => void {
  bind();
  backButtonListeners.add(listener);
  return () => {
    backButtonListeners.delete(listener);
    unbindIfIdle();
  };
}
