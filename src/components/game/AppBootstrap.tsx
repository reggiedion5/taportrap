import { useCallback, useEffect, useState } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { useAppStartup } from "@/hooks/useAppStartup";
import { useNativeStatusBar } from "@/hooks/useNativeStatusBar";
import { resetAllLocalData } from "@/game/progressStore";
import { startTypographyGuard } from "@/lib/typographyGuard";

interface AppBootstrapProps {
  /** True once local progress has been read from storage. */
  dataHydrated: boolean;
  /** Theme id currently applied to the document. */
  themeId: string;
  /** Sends the player back to the home screen after an error. */
  onReturnToMenu: () => void;
  children: React.ReactNode;
}

function BootSplash() {
  return (
    <div
      role="status"
      aria-label="Loading Tap or Trap!"
      className="safe-screen grid place-items-center bg-arcade-bg-deep"
    >
      <span className="sticker-text text-3xl text-neon-green glow-green">TAP OR TRAP!</span>
    </div>
  );
}

/**
 * Owns the startup sequence: storage check, theme application, splash hand-off
 * and the top-level error boundary. Nothing gameplay-related happens here.
 */
export function AppBootstrap({
  dataHydrated,
  themeId,
  onReturnToMenu,
  children,
}: AppBootstrapProps) {
  const [themeApplied, setThemeApplied] = useState(false);
  useNativeStatusBar(themeId);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.documentElement.dataset.theme === themeId) setThemeApplied(true);
  }, [themeId, dataHydrated]);

  // Dev-only: warn if long-form copy renders in the arcade display font.
  useEffect(() => startTypographyGuard(), []);

  const startup = useAppStartup(dataHydrated, themeApplied);

  const handleReset = useCallback(() => {
    resetAllLocalData();
  }, []);

  return (
    <ErrorBoundary onResetLocalData={handleReset} onReturnToMenu={onReturnToMenu}>
      {startup.ready ? children : <BootSplash />}
      {startup.ready && !startup.storageAvailable && (
        <div
          role="status"
          className="safe-action-bar pointer-events-none fixed inset-x-0 bottom-0 z-[60] px-4"
        >
          <p className="mx-auto max-w-sm rounded-2xl border border-neon-gold/60 bg-arcade-bg-deep/95 px-4 py-3 text-center text-xs font-bold text-neon-gold">
            Saving is unavailable on this device, so progress won't be kept between sessions. You
            can still play every mode.
          </p>
        </div>
      )}
    </ErrorBoundary>
  );
}
