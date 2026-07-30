/**
 * Status bar wrapper.
 *
 * Every call is a no-op in the browser and fails silently if the plugin is
 * missing. The bar stays visible in menus and gameplay; only its style and
 * background colour follow the active theme.
 */

import { isNativePlatform, isPluginAvailable } from "./nativePlatform";

interface StatusBarPlugin {
  setStyle: (options: { style: "DARK" | "LIGHT" | "DEFAULT" }) => Promise<void>;
  setBackgroundColor: (options: { color: string }) => Promise<void>;
  setOverlaysWebView: (options: { overlay: boolean }) => Promise<void>;
}

let plugin: StatusBarPlugin | null = null;
let loading: Promise<StatusBarPlugin | null> | null = null;
let lastApplied = "";

async function getPlugin(): Promise<StatusBarPlugin | null> {
  if (plugin) return plugin;
  if (!isNativePlatform() || !isPluginAvailable("StatusBar")) return null;
  if (!loading) {
    loading = import("@capacitor/status-bar")
      .then((mod) => {
        plugin = mod.StatusBar as unknown as StatusBarPlugin;
        return plugin;
      })
      .catch(() => null);
  }
  return loading;
}

export interface StatusBarAppearance {
  /** Background colour behind the status bar, e.g. "#07080f". */
  backgroundColor: string;
  /** "DARK" renders light icons — correct for this app's dark themes. */
  style: "DARK" | "LIGHT";
}

/** Applies appearance only when it actually changed. */
export async function applyStatusBarAppearance(appearance: StatusBarAppearance): Promise<void> {
  const signature = `${appearance.style}:${appearance.backgroundColor}`;
  if (signature === lastApplied) return;

  const bar = await getPlugin();
  if (!bar) {
    lastApplied = signature;
    return;
  }

  try {
    await bar.setOverlaysWebView({ overlay: false });
    await bar.setStyle({ style: appearance.style });
    await bar.setBackgroundColor({ color: appearance.backgroundColor });
    lastApplied = signature;
  } catch {
    /* native chrome is cosmetic — never block the app */
  }
}
