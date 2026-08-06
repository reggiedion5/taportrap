/**
 * Send Feedback.
 *
 * Builds a mailto: link with a structured, non-identifying body. Nothing is
 * transmitted automatically — the player's own mail client sends the message,
 * and the body is shown in full before sending so there are no surprises.
 */

import { APP_BUILD, APP_NAME, APP_VERSION, SUPPORT_EMAIL } from "@/lib/appConfig";
import { isValidSupportEmail } from "@/lib/urlSafety";
import { getPlatform } from "@/lib/nativePlatform";
import type { FeedbackCategory } from "./trainingTypes";

export interface FeedbackCategoryOption {
  id: FeedbackCategory;
  label: string;
  hint: string;
}

export const FEEDBACK_CATEGORIES: FeedbackCategoryOption[] = [
  { id: "bug", label: "Bug report", hint: "Something is broken or behaves oddly." },
  { id: "gameplay", label: "Gameplay", hint: "Balance, difficulty or feel." },
  { id: "suggestion", label: "Suggestion", hint: "An idea for a new feature." },
  { id: "accessibility", label: "Accessibility", hint: "Something is hard to see, hear or tap." },
  { id: "other", label: "Other", hint: "Anything else." },
];

export const FEEDBACK_MAX_LENGTH = 1000;

export interface FeedbackInput {
  category: FeedbackCategory;
  message: string;
}

/** Coarse platform label only — no device ids, no identifiers, no analytics. */
export function feedbackContext(): string[] {
  return [`App: ${APP_NAME} ${APP_VERSION} (build ${APP_BUILD})`, `Platform: ${getPlatform()}`];
}

export function feedbackAvailable(): boolean {
  return isValidSupportEmail(SUPPORT_EMAIL);
}

export function feedbackSubject(category: FeedbackCategory): string {
  const label = FEEDBACK_CATEGORIES.find((c) => c.id === category)?.label ?? "Feedback";
  return `${APP_NAME} — ${label}`;
}

export function feedbackBody(input: FeedbackInput): string {
  const message = input.message.trim().slice(0, FEEDBACK_MAX_LENGTH);
  return [message, "", "---", ...feedbackContext()].join("\n");
}

export function feedbackMailto(input: FeedbackInput): string | null {
  if (!feedbackAvailable()) return null;
  const subject = encodeURIComponent(feedbackSubject(input.category));
  const body = encodeURIComponent(feedbackBody(input));
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}
