import { useCallback, useEffect, useState } from "react";
import { applyStatusBarAppearance } from "@/lib/nativeStatusBar";

/** Resolves the current theme's deep background to a hex colour for native chrome. */
function readBackdropColor(): string {
  if (typeof window === "undefined") return "#07080f";
  try {
    const probe = document.createElement("span");
    probe.style.color = "var(--arcade-bg-deep)";
    probe.style.display = "none";
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    const match = computed.match(/(\d+(?:\.\d+)?)/g);
    if (!match || match.length < 3) return "#07080f";
    const hex = match
      .slice(0, 3)
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(Number(v))))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
    return `#${hex}`;
  } catch {
    return "#07080f";
  }
}

/**
 * Keeps the native status bar visually integrated with the selected theme.
 * All themes are dark, so light status-bar content is always the readable choice.
 */
export function useNativeStatusBar(themeId: string) {
  const [color, setColor] = useState("#07080f");

  const sync = useCallback(() => {
    const next = readBackdropColor();
    setColor(next);
    void applyStatusBarAppearance({ backgroundColor: next, style: "DARK" });
    if (typeof document !== "undefined") {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", next);
    }
  }, []);

  useEffect(() => {
    // One frame of delay lets the theme's CSS variables land first.
    const id = window.requestAnimationFrame(sync);
    return () => window.cancelAnimationFrame(id);
  }, [themeId, sync]);

  return color;
}
