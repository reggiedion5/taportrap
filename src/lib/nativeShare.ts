/**
 * Share service.
 *
 * Priority: Capacitor native share → Web Share API → clipboard copy.
 * User cancellation is reported as its own outcome so the UI never shows an
 * error for a deliberate dismissal. The payload is text only; the structure
 * leaves room for a generated share image later.
 */

import { isNativePlatform, isPluginAvailable } from "./nativePlatform";

export interface SharePayload {
  title: string;
  text: string;
  /** Reserved for a future generated result card. Never a local file path. */
  url?: string;
}

export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

interface SharePlugin {
  share: (options: {
    title?: string;
    text?: string;
    url?: string;
    dialogTitle?: string;
  }) => Promise<unknown>;
  canShare?: () => Promise<{ value: boolean }>;
}

function isCancellation(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /cancel|abort|dismiss/i.test(message);
}

async function nativeShare(payload: SharePayload): Promise<ShareOutcome | null> {
  if (!isNativePlatform() || !isPluginAvailable("Share")) return null;
  try {
    const mod = await import("@capacitor/share");
    const plugin = mod.Share as unknown as SharePlugin;
    await plugin.share({
      title: payload.title,
      text: payload.text,
      url: payload.url,
      dialogTitle: payload.title,
    });
    return "shared";
  } catch (error) {
    return isCancellation(error) ? "cancelled" : null;
  }
}

async function webShare(payload: SharePayload): Promise<ShareOutcome | null> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return null;
  try {
    await navigator.share({ title: payload.title, text: payload.text, url: payload.url });
    return "shared";
  } catch (error) {
    return isCancellation(error) ? "cancelled" : null;
  }
}

async function clipboardCopy(text: string): Promise<ShareOutcome | null> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return "copied";
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function share(payload: SharePayload): Promise<ShareOutcome> {
  const native = await nativeShare(payload);
  if (native) return native;

  const web = await webShare(payload);
  if (web) return web;

  const copied = await clipboardCopy(payload.text);
  if (copied) return copied;

  return "failed";
}

export function shareAvailable(): boolean {
  if (isNativePlatform() && isPluginAvailable("Share")) return true;
  if (typeof navigator === "undefined") return false;
  return typeof navigator.share === "function" || Boolean(navigator.clipboard?.writeText);
}
