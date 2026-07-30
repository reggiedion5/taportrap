import { useEffect, useRef } from "react";
import { onAppBackground, onAppForeground, type InterruptionEvent } from "@/lib/appLifecycle";

export interface NativeAppLifecycleOptions {
  /** Called once per interruption, regardless of how many APIs reported it. */
  onBackground?: (event: InterruptionEvent) => void;
  /** Called when the app becomes active again. Must not auto-resume the game. */
  onForeground?: (event: InterruptionEvent) => void;
}

/**
 * Subscribes to the unified interruption bus. Handlers are held in refs so
 * rerenders never re-register listeners, and everything unsubscribes on unmount.
 */
export function useNativeAppLifecycle({ onBackground, onForeground }: NativeAppLifecycleOptions) {
  const backgroundRef = useRef(onBackground);
  backgroundRef.current = onBackground;
  const foregroundRef = useRef(onForeground);
  foregroundRef.current = onForeground;

  useEffect(() => {
    const offBackground = onAppBackground((event) => backgroundRef.current?.(event));
    const offForeground = onAppForeground((event) => foregroundRef.current?.(event));
    return () => {
      offBackground();
      offForeground();
    };
  }, []);
}
