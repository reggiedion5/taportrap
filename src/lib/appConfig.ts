/**
 * Single source of truth for app identity and release links.
 *
 * Everything is read from build-time `VITE_*` values with safe empty defaults so
 * gameplay never depends on configuration. Missing release links are treated as
 * "not configured yet" and the related UI actions are disabled instead of
 * rendering broken anchors.
 */

const env = import.meta.env as Record<string, string | boolean | undefined>;

function text(key: string, fallback = ""): string {
  const value = env[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

export const APP_NAME = text("VITE_APP_NAME", "Tap or Trap!");
export const APP_TAGLINE = "Tap fast. Think faster.";

/** Marketing version — must match CFBundleShortVersionString in Xcode. */
export const APP_VERSION = text("VITE_APP_VERSION", "1.0.0");
/** Build number — must match CFBundleVersion in Xcode. */
export const APP_BUILD = text("VITE_APP_BUILD", "1");

/** Suggested bundle identifier. Confirm/replace before the first archive. */
export const SUGGESTED_BUNDLE_ID = "com.reggiedion.taportrap";

/** Empty until a real inbox exists — the Send Email action stays disabled. */
export const SUPPORT_EMAIL = text("VITE_SUPPORT_EMAIL");
export const SUPPORT_URL = text("VITE_SUPPORT_URL");
export const PRIVACY_URL = text("VITE_PRIVACY_URL");
export const APP_STORE_URL = text("VITE_APP_STORE_URL");

/** Placeholder date — replace with the real effective date before submission. */
export const PRIVACY_EFFECTIVE_DATE = text("VITE_PRIVACY_EFFECTIVE_DATE");

export const IS_DEV = import.meta.env.DEV === true;

/**
 * Native packaging flags.
 *
 * These describe assets that live in Xcode rather than in this repo, so they
 * cannot be detected at runtime — flip them by hand once the step is done.
 */

/** Master 1024×1024 icon: `resources/app-icon-1024.png` (see docs/app-icon-spec.md). */
export const APP_ICON_PRESENT = true;

/** Flip to true after confirming the solid #07080f launch screen in Xcode. */
export const LAUNCH_ASSET_VERIFIED = false;

/** Mirrors `server.url` in capacitor.config.ts. Must stay empty for production. */
export const NATIVE_SERVER_URL = "";

export const APP_CONFIG = {
  name: APP_NAME,
  tagline: APP_TAGLINE,
  version: APP_VERSION,
  build: APP_BUILD,
  supportEmail: SUPPORT_EMAIL,
  supportUrl: SUPPORT_URL,
  privacyUrl: PRIVACY_URL,
  appStoreUrl: APP_STORE_URL,
  privacyEffectiveDate: PRIVACY_EFFECTIVE_DATE,
} as const;

export type AppConfig = typeof APP_CONFIG;

export function versionLabel(): string {
  return `${APP_VERSION} (${APP_BUILD})`;
}
