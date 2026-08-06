/**
 * Phase 1 feature flags.
 *
 * Everything not listed as `true` stays disabled until a later phase. Flags are
 * read at call sites so a feature can be switched off without touching game
 * logic, which keeps the native iOS build easy to bisect.
 */
export interface GameFeatureFlags {
  comboSystem: boolean;
  perfectTapSystem: boolean;
  closeCallSystem: boolean;
  dynamicDifficulty: boolean;
  statisticsSystem: boolean;
  diagnosticPanel: boolean;
  /* --- reserved for later phases --- */
  xpSystem: boolean;
  themeSystem: boolean;
  missionSystem: boolean;
  achievementSystem: boolean;
  audioSystem: boolean;
  sharingSystem: boolean;
  redesignedGameOver: boolean;
}

export const GAME_FEATURES: GameFeatureFlags = {
  comboSystem: true,
  perfectTapSystem: true,
  closeCallSystem: true,
  dynamicDifficulty: true,
  statisticsSystem: true,
  diagnosticPanel: false,

  xpSystem: true,
  themeSystem: false,
  missionSystem: true,
  achievementSystem: true,
  audioSystem: false,
  sharingSystem: false,
  redesignedGameOver: false,

};

export const isFeatureEnabled = (key: keyof GameFeatureFlags): boolean =>
  GAME_FEATURES[key] === true;

/**
 * The diagnostic panel is hidden everywhere by default. It only appears in a
 * local dev server AND after a deliberate opt-in:
 *   localStorage.setItem("showDiagnosticPanel", "true")
 * It can never render in preview builds, production, or the native iOS bundle.
 */
export const diagnosticsVisible = (): boolean => {
  if (import.meta.env.DEV !== true) return false;
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem("showDiagnosticPanel") !== "true") return false;
  } catch {
    return false;
  }
  return true;
};
