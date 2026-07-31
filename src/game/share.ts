import { MODE_CONFIG } from "./modes";
import type { GameSessionResult } from "./progressionTypes";

export function formatShareText(result: GameSessionResult): string {
  const mode = MODE_CONFIG[result.mode].name;
  const parts = [
    `I scored ${result.score} in Tap or Trap! ${mode}`,
    `with a ${result.bestCombo} combo`,
  ];
  if (result.stats.avgReaction !== null) {
    parts.push(`and a ${result.stats.avgReaction}ms average reaction time`);
  }
  return `${parts.join(" ")}. Can you beat me?`;
}

export type ShareOutcome = "shared" | "copied" | "failed";

export async function shareResult(text: string): Promise<ShareOutcome> {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({ text, title: "Tap or Trap!" });
      return "shared";
    }
  } catch (error) {
    // user cancelled the native sheet — do not fall through to clipboard
    if (error instanceof DOMException && error.name === "AbortError") {
      return "failed";
    }
  }
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return "copied";
    }
  } catch {
    /* fall through */
  }
  return "failed";
}
