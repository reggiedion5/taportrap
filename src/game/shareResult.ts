/**
 * Centralised share service.
 *
 * One typed payload describes every result screen; the formatters turn it into
 * text. Delivery goes through the native share plugin, then the Web Share API,
 * then the clipboard. Nothing device-specific or private is ever included, and
 * the App Store link is only appended once a valid production URL exists.
 */

import { APP_NAME, APP_STORE_URL } from "@/lib/appConfig";
import { isValidHttpsUrl } from "@/lib/urlSafety";
import { share as deliverShare, type ShareOutcome } from "@/lib/nativeShare";
import { MODE_CONFIG, type GameMode } from "./modes";
import { TRAINER_MODULES } from "./trainingConfig";
import type { PlayableMode, TrainingDifficulty, TrainingModule } from "./trainingTypes";

export type { ShareOutcome };

export interface ShareResultData {
  mode: PlayableMode;
  score: number | null;
  combo: number | null;
  averageReaction: number | null;
  accuracy: number | null;
  sessionDuration: number | null;
  personalBest: boolean;
  playerLevel: number | null;
  appStoreUrl: string | null;
  kidsAssistEnabled: boolean;
  trainerModule: TrainingModule | null;
  trainerDifficulty: TrainingDifficulty | null;
  /** zen only */
  taps: number | null;
  longestStreak: number | null;
  /** survival / focus */
  successes: number | null;
}

export function emptyShareData(mode: PlayableMode): ShareResultData {
  return {
    mode,
    score: null,
    combo: null,
    averageReaction: null,
    accuracy: null,
    sessionDuration: null,
    personalBest: false,
    playerLevel: null,
    appStoreUrl: null,
    kidsAssistEnabled: false,
    trainerModule: null,
    trainerDifficulty: null,
    taps: null,
    longestStreak: null,
    successes: null,
  };
}

/** Only a real, configured production URL is ever appended. */
export function shareLink(): string | null {
  if (!isValidHttpsUrl(APP_STORE_URL)) return null;
  try {
    const host = new URL(APP_STORE_URL).hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com")) {
      return null;
    }
  } catch {
    return null;
  }
  return APP_STORE_URL;
}

function withLink(text: string, data: ShareResultData): string {
  const link = data.appStoreUrl ?? shareLink();
  return link ? `${text} ${link}` : text;
}

/* ---------------- formatters ---------------- */

export function formatCompetitiveShareText(data: ShareResultData): string {
  const mode = MODE_CONFIG[data.mode as GameMode]?.name ?? "";
  const score = Math.max(0, Math.round(data.score ?? 0));
  const parts: string[] = [];

  if (data.mode === "blitz") {
    parts.push(`I scored ${score} in ${APP_NAME} Blitz before time ran out`);
    if (data.combo) parts.push(`with a ${data.combo} combo`);
  } else if (data.mode === "survival") {
    parts.push(`I survived ${Math.max(0, data.successes ?? 0)} reactions in ${APP_NAME} Survival`);
    if (data.combo) parts.push(`with a ${data.combo} combo`);
  } else {
    parts.push(`I scored ${score} in ${APP_NAME} ${mode}`);
    if (data.combo) parts.push(`with a ${data.combo} combo`);
    if (data.averageReaction !== null) {
      parts.push(`${data.combo ? "and" : "with"} a ${Math.round(data.averageReaction)}ms average reaction time`);
    }
  }

  if (data.mode !== "classic" && data.mode !== "focus" && data.averageReaction !== null) {
    parts.push(`and a ${Math.round(data.averageReaction)}ms average reaction time`);
  }

  let text = `${parts.join(" ")}.`;
  if (data.personalBest) text += " New personal best!";
  text += data.mode === "blitz" ? " Can you top it?" : " Can you beat me?";
  return withLink(text, data);
}

export function formatZenShareText(data: ShareResultData): string {
  const taps = Math.max(0, Math.round(data.taps ?? 0));
  if (data.kidsAssistEnabled) {
    return withLink(`I completed ${taps} taps in ${APP_NAME} Zen Mode.`, data);
  }
  const streak = data.longestStreak ?? 0;
  const streakPart = streak > 0 ? ` with a ${streak}-tap streak` : "";
  return withLink(`I completed ${taps} taps in a ${APP_NAME} Zen session${streakPart}.`, data);
}

export function formatTrainerShareText(data: ShareResultData): string {
  const module = data.trainerModule ? TRAINER_MODULES[data.trainerModule].name : "Reflex Trainer";
  const accuracy = Math.round((data.accuracy ?? 0) * 100);
  return withLink(`I completed ${module} in ${APP_NAME} with ${accuracy}% accuracy.`, data);
}

export function formatShareText(data: ShareResultData): string {
  if (data.mode === "zen") return formatZenShareText(data);
  if (data.mode === "trainer") return formatTrainerShareText(data);
  return formatCompetitiveShareText(data);
}

/* ---------------- delivery ---------------- */

export async function shareResult(data: ShareResultData): Promise<ShareOutcome> {
  return deliverShare({ title: APP_NAME, text: formatShareText(data) });
}

export function shareOutcomeMessage(outcome: ShareOutcome): string | null {
  switch (outcome) {
    case "copied":
      return "Result copied to clipboard";
    case "shared":
      return "Shared";
    case "cancelled":
      return null;
    default:
      return "Sharing isn't available on this device";
  }
}
