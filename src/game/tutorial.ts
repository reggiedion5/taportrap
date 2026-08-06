import type { TargetColor } from "./types";

/** One-time XP reward for finishing the interactive tutorial. */
export const TUTORIAL_XP = 50;

export type TutorialAction = "tap" | "avoid" | "timed" | "combo";

export interface TutorialStep {
  id: string;
  color: TargetColor;
  title: string;
  instruction: string;
  action: TutorialAction;
  /** How long an "avoid" target stays on screen before it safely expires. */
  holdMs: number;
  /** How many taps a "combo" step needs. */
  repeat?: number;
}

/**
 * Teaching order: safe tap → trap → bonus → timing → combo. The tutorial is
 * fully local, needs no network and never writes competitive progress.
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "green",
    color: "green",
    title: "Tap the green target",
    instruction: "Green means TAP. Hit it once.",
    action: "tap",
    holdMs: 0,
  },
  {
    id: "red",
    color: "red",
    title: "Never tap red",
    instruction: "Red is a TRAP. Do not tap it — wait for it to disappear safely.",
    action: "avoid",
    holdMs: 2600,
  },
  {
    id: "gold",
    color: "gold",
    title: "Grab the bonus",
    instruction: "Gold is worth extra points. Tap it.",
    action: "tap",
    holdMs: 0,
  },
  {
    id: "timed",
    color: "green",
    title: "React fast",
    instruction: "Tap as quickly as you can — fast reactions score Perfect.",
    action: "timed",
    holdMs: 0,
  },
  {
    id: "combo",
    color: "green",
    title: "Build a combo",
    instruction: "Tap three safe targets in a row without a mistake.",
    action: "combo",
    holdMs: 0,
    repeat: 3,
  },
];
