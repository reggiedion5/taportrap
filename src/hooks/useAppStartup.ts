import { useCallback, useEffect, useRef, useState } from "react";
import { hideSplashScreen, armSplashFailsafe } from "@/lib/nativeSplash";
import { checkStorageAvailability } from "@/lib/storageHealth";
import { isNativePlatform } from "@/lib/nativePlatform";
import { primeHaptics } from "@/lib/nativeHaptics";

export type StartupPhase =
  | "initializing"
  | "loading-storage"
  | "migrating-storage"
  | "loading-preferences"
  | "applying-theme"
  | "ready"
  | "recoverable-error";

export interface StartupState {
  phase: StartupPhase;
  ready: boolean;
  storageAvailable: boolean;
  errorMessage: string | null;
}

/**
 * Drives the explicit startup sequence: nothing renders the full home screen
 * before local data and the selected theme are in place. Runs exactly once even
 * under React Strict Mode's double effect invocation.
 */
export function useAppStartup(dataHydrated: boolean, themeApplied: boolean): StartupState {
  const [phase, setPhase] = useState<StartupPhase>("initializing");
  const [storageOk, setStorageOk] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const started = useRef(false);
  const splashHidden = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const disarm = armSplashFailsafe();

    try {
      setPhase("loading-storage");
      const availability = checkStorageAvailability();
      setStorageOk(availability === "available");
      setPhase("migrating-storage");
      if (isNativePlatform()) primeHaptics();
      setPhase("loading-preferences");
    } catch (error) {
      setPhase("recoverable-error");
      setErrorMessage(error instanceof Error ? error.message : "Startup could not complete.");
    }

    return disarm;
  }, []);

  useEffect(() => {
    if (phase === "recoverable-error" || phase === "ready") return;
    if (!dataHydrated) return;
    setPhase(themeApplied ? "ready" : "applying-theme");
  }, [dataHydrated, themeApplied, phase]);

  const ready = phase === "ready" || phase === "recoverable-error";

  useEffect(() => {
    if (!ready || splashHidden.current) return;
    splashHidden.current = true;
    // One frame so the first painted screen is the app, never a white flash.
    const id = window.requestAnimationFrame(() => hideSplashScreen());
    return () => window.cancelAnimationFrame(id);
  }, [ready]);

  const reset = useCallback(() => setErrorMessage(null), []);
  void reset;

  return { phase, ready, storageAvailable: storageOk, errorMessage };
}
