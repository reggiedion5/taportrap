import { useEffect, useState } from "react";
import { isLikelyMobileDevice } from "@/lib/nativePlatform";
import { useViewportMetrics } from "./useViewportMetrics";

/**
 * True only when a phone-sized device is held in landscape while a run is
 * active. Desktop browsers with wide windows and tablets with usable layouts
 * are deliberately excluded.
 */
export function useOrientationGuard(active: boolean): boolean {
  const metrics = useViewportMetrics();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isLikelyMobileDevice());
  }, []);

  if (!active || !mobile || !metrics.isLandscape) return false;
  // Landscape is only a problem when the short edge cannot fit the play area.
  return metrics.height < 560;
}
