/**
 * Single source of truth for feature flags (Phases 1–4).
 *
 * Everything not listed as `true` stays disabled. Flags are read at call sites
 * so a feature can be switched off without touching game logic, which keeps the
 * native iOS build easy to bisect. Do not create a second flag file.
 */
export interface GameFeatureFlags {
  /* --- phase 1 --- */
  comboSystem: boolean;
  perfectTapSystem: boolean;
  closeCallSystem: boolean;
  dynamicDifficulty: boolean;
  statisticsSystem: boolean;
  diagnosticPanel: boolean;
  /* --- phase 2 / 3 --- */
  xpSystem: boolean;
  themeSystem: boolean;
  missionSystem: boolean;
  achievementSystem: boolean;
  audioSystem: boolean;
  sharingSystem: boolean;
  redesignedGameOver: boolean;
  /* --- phase 4: release readiness --- */
  onboarding: boolean;
  tutorial: boolean;
  practiceMode: boolean;
  releasePolish: boolean;
  accessibilityAudit: boolean;
  offlineMode: boolean;
  performanceMonitoring: boolean;
  privacyCenter: boolean;
  supportCenter: boolean;
  feedbackTools: boolean;
  safeAnalytics: boolean;
  releaseReadiness: boolean;
  qaTools: boolean;
  /* --- intentionally out of scope --- */
  onlineMultiplayer: boolean;
  globalLeaderboards: boolean;
  accounts: boolean;
  cloudSave: boolean;
  ads: boolean;
  inAppPurchases: boolean;
  subscriptions: boolean;
  paidCurrency: boolean;
  battlePass: boolean;
  remoteStartupDependencies: boolean;
  instantReplay: boolean;
  advancedParticles: boolean;
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
  audioSystem: true,
  sharingSystem: true,
  redesignedGameOver: true,

  onboarding: true,
  tutorial: true,
  practiceMode: true,
  releasePolish: true,
  accessibilityAudit: true,
  offlineMode: true,
  performanceMonitoring: true,
  privacyCenter: true,
  supportCenter: true,
  feedbackTools: true,
  safeAnalytics: true,
  releaseReadiness: true,
  qaTools: true,

  onlineMultiplayer: false,
  globalLeaderboards: false,
  accounts: false,
  cloudSave: false,
  ads: false,
  inAppPurchases: false,
  subscriptions: false,
  paidCurrency: false,
  battlePass: false,
  remoteStartupDependencies: false,
  instantReplay: false,
  advancedParticles: false,
};

export const isFeatureEnabled = (key: keyof GameFeatureFlags): boolean =>
  GAME_FEATURES[key] === true;

/**
 * Dev-only surfaces (diagnostic panel, Release QA screen). Hidden everywhere by
 * default: they need a local dev server AND a deliberate opt-in flag, so they
 * can never render in preview, production, or the native iOS bundle.
 */
export const devToolsVisible = (optInKey: string): boolean => {
  if (import.meta.env.DEV !== true) return false;
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(optInKey) === "true";
  } catch {
    return false;
  }
};

export const diagnosticsVisible = (): boolean => devToolsVisible("showDiagnosticPanel");

export const qaScreenVisible = (): boolean =>
  isFeatureEnabled("qaTools") && import.meta.env.DEV === true;
