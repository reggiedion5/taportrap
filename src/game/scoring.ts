export type ReactionGrade = "PERFECT" | "FAST" | "GOOD";

export function multiplierForCombo(combo: number): number {
  if (combo >= 20) return 4;
  if (combo >= 10) return 3;
  if (combo >= 5) return 2;
  return 1;
}

export function gradeReaction(ms: number): ReactionGrade {
  if (ms < 250) return "PERFECT";
  if (ms <= 450) return "FAST";
  return "GOOD";
}

export interface ScoreResult {
  combo: number;
  multiplier: number;
  base: number;
  total: number;
  isMilestone: boolean;
}

/**
 * Single entry point for every successful reaction.
 * The success that *creates* combo 5/10/20 already receives the new multiplier.
 */
export function resolveScore(base: number, comboBefore: number): ScoreResult {
  const combo = comboBefore + 1;
  const multiplier = multiplierForCombo(combo);
  return {
    combo,
    multiplier,
    base,
    total: base * multiplier,
    isMilestone: combo === 5 || combo === 10 || combo === 20,
  };
}
