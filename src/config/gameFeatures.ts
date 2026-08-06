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
  diagnosticPanel: true,

  xpSystem: false,
  themeSystem: false,
  missionSystem: false,
  achievementSystem: false,
  audioSystem: false,
  sharingSystem: false,
  redesignedGameOver: false,
};

export const isFeatureEnabled = (key: keyof GameFeatureFlags): boolean =>
  GAME_FEATURES[key] === true;

/** The diagnostic panel is dev-only regardless of the flag. */
export const diagnosticsVisible = (): boolean =>
  GAME_FEATURES.diagnosticPanel && import.meta.env.DEV === true;
