/**
 * Safe URL handling for the native container.
 *
 * The WebView must never navigate away from the bundled app, and no
 * user-influenced value may ever end up in a `javascript:` or `data:` URL.
 * External links are opened by the operating system instead.
 */

import { APP_STORE_URL, PRIVACY_URL, SUPPORT_EMAIL, SUPPORT_URL } from "./appConfig";
import { isNativePlatform } from "./nativePlatform";

/** Only these configured HTTPS destinations may leave the app. */
function trustedExternalUrls(): string[] {
  return [SUPPORT_URL, PRIVACY_URL, APP_STORE_URL].filter((value) => value.length > 0);
}

export function isValidHttpsUrl(value: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.length > 0;
  } catch {
    return false;
  }
}

export function isTrustedExternalUrl(value: string): boolean {
  if (!isValidHttpsUrl(value)) return false;
  return trustedExternalUrls().some((allowed) => {
    if (!isValidHttpsUrl(allowed)) return false;
    try {
      return new URL(allowed).origin === new URL(value).origin;
    } catch {
      return false;
    }
  });
}

export function isValidSupportEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && !/example\.(com|org|net)$/i.test(value);
}

export const supportEmailConfigured = () => isValidSupportEmail(SUPPORT_EMAIL);

export type OpenResult = "opened" | "blocked" | "unavailable";

/**
 * Opens a configured external HTTPS link outside the app WebView.
 * Anything not explicitly trusted is rejected.
 */
export function openExternalUrl(value: string): OpenResult {
  if (!isTrustedExternalUrl(value)) return "blocked";
  if (typeof window === "undefined") return "unavailable";
  try {
    // `_blank` + noopener hands the URL to Safari on iOS rather than the WebView.
    window.open(value, "_blank", "noopener,noreferrer");
    return "opened";
  } catch {
    return "unavailable";
  }
}

/** Only usable once a real support inbox has been configured. */
export function openSupportEmail(subject: string): OpenResult {
  if (!supportEmailConfigured()) return "unavailable";
  if (typeof window === "undefined") return "unavailable";
  try {
    const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
    window.open(href, isNativePlatform() ? "_system" : "_self");
    return "opened";
  } catch {
    return "unavailable";
  }
}
