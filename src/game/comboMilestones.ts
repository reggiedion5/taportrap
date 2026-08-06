/**
 * Combo milestones.
 *
 * Milestones are pure presentation: a floating banner, a glow and a small
 * pulse. They never pause the run and never open a modal.
 */

export interface ComboMilestone {
  combo: number;
  label: string;
}

export const COMBO_MILESTONES: ComboMilestone[] = [
  { combo: 5, label: "HOT STREAK" },
  { combo: 10, label: "ON FIRE" },
  { combo: 15, label: "LOCKED IN" },
  { combo: 20, label: "UNSTOPPABLE" },
  { combo: 30, label: "REFLEX MACHINE" },
  { combo: 50, label: "LIGHTNING HANDS" },
];

export function milestoneFor(combo: number): ComboMilestone | null {
  return COMBO_MILESTONES.find((m) => m.combo === combo) ?? null;
}
