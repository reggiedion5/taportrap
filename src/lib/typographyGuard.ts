/**
 * Development-only typography guard.
 *
 * The arcade DISPLAY font (Space Mono) is reserved for short impact labels.
 * This scans the rendered DOM and warns whenever a long paragraph or
 * description ends up rendering in that face, so readability regressions are
 * caught while developing. It is a no-op in production builds.
 */

import { IS_DEV } from "@/lib/appConfig";

/** Copy longer than this counts as long-form. */
const MAX_DISPLAY_TEXT_LENGTH = 48;

const DISPLAY_FAMILY = /space\s*mono/i;

const seen = new WeakSet<Element>();

function ownText(el: Element): string {
  let text = "";
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) text += node.textContent ?? "";
  });
  return text.replace(/\s+/g, " ").trim();
}

function auditOnce(root: ParentNode) {
  const elements = root.querySelectorAll<HTMLElement>("p, span, li, div, h1, h2, h3, h4, label");
  elements.forEach((el) => {
    if (seen.has(el)) return;
    const text = ownText(el);
    const isParagraph = el.tagName === "P";
    if (!isParagraph && text.length <= MAX_DISPLAY_TEXT_LENGTH) return;
    if (isParagraph && text.length === 0) return;

    const family = window.getComputedStyle(el).fontFamily;
    if (!DISPLAY_FAMILY.test(family)) return;

    seen.add(el);
    console.warn(
      "[Tap or Trap! typography] Long-form copy is rendering in the arcade display font. " +
        "Use ui-body, ui-body-tight or ui-prose instead.",
      { element: el, characters: text.length, text: text.slice(0, 80) },
    );
  });
}

/** Starts the guard. Returns a cleanup function. */
export function startTypographyGuard(): () => void {
  if (!IS_DEV || typeof window === "undefined") return () => {};

  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      auditOnce(document.body);
    });
  };

  schedule();
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });

  return () => {
    observer.disconnect();
    if (frame) window.cancelAnimationFrame(frame);
  };
}
