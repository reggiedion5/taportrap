import { useEffect, useState } from "react";

export interface ViewportMetrics {
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
  safeWidth: number;
  safeHeight: number;
  isCompactHeight: boolean;
  isLandscape: boolean;
}

const EMPTY: ViewportMetrics = {
  width: 0,
  height: 0,
  orientation: "portrait",
  safeWidth: 0,
  safeHeight: 0,
  isCompactHeight: false,
  isLandscape: false,
};

function readInset(name: string): number {
  if (typeof window === "undefined") return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}

function measure(): ViewportMetrics {
  if (typeof window === "undefined") return EMPTY;
  const width = window.visualViewport?.width ?? window.innerWidth;
  const height = window.visualViewport?.height ?? window.innerHeight;
  const top = readInset("--safe-top");
  const bottom = readInset("--safe-bottom");
  const left = readInset("--safe-left");
  const right = readInset("--safe-right");
  const isLandscape = width > height;
  return {
    width,
    height,
    orientation: isLandscape ? "landscape" : "portrait",
    safeWidth: Math.max(0, width - left - right),
    safeHeight: Math.max(0, height - top - bottom),
    isCompactHeight: height < 680,
    isLandscape,
  };
}

/**
 * Viewport metrics that survive browser-chrome changes and orientation flips.
 * Updates are coalesced into one animation frame so resizes cannot flood React.
 */
export function useViewportMetrics(): ViewportMetrics {
  const [metrics, setMetrics] = useState<ViewportMetrics>(EMPTY);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setMetrics((previous) => {
          const next = measure();
          const same =
            previous.width === next.width &&
            previous.height === next.height &&
            previous.safeWidth === next.safeWidth &&
            previous.safeHeight === next.safeHeight;
          return same ? previous : next;
        });
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return metrics;
}
