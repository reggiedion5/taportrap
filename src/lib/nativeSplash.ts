/**
 * Splash screen wrapper — hidden exactly once, with a safety timeout so it can
 * never stay on screen forever.
 */

import { isNativePlatform, isPluginAvailable } from "./nativePlatform";

let hidden = false;
const MAX_VISIBLE_MS = 6000;

export function hideSplashScreen(): void {
  if (hidden) return;
  hidden = true;
  if (!isNativePlatform() || !isPluginAvailable("SplashScreen")) return;
  void import("@capacitor/splash-screen")
    .then((mod) => mod.SplashScreen.hide({ fadeOutDuration: 220 }))
    .catch(() => {});
}

/** Guarantees the splash disappears even if startup never reports ready. */
export function armSplashFailsafe(): () => void {
  if (typeof window === "undefined") return () => {};
  const id = window.setTimeout(hideSplashScreen, MAX_VISIBLE_MS);
  return () => window.clearTimeout(id);
}
