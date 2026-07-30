/**
 * Centralised Capacitor platform detection.
 *
 * Nothing else in the app should import `@capacitor/core` for platform checks.
 * Every accessor is defensive: in a plain browser build (or during SSR) the
 * Capacitor global simply does not exist and every value degrades to "web".
 */

export type PlatformName = "ios" | "android" | "web";

export interface NativeCapability {
  haptics: boolean;
  nativeShare: boolean;
  appLifecycle: boolean;
  statusBar: boolean;
  splashScreen: boolean;
  nativeStorage: boolean;
}

interface CapacitorGlobal {
  getPlatform?: () => string;
  isNativePlatform?: () => boolean;
  isPluginAvailable?: (name: string) => boolean;
}

function cap(): CapacitorGlobal | null {
  if (typeof window === "undefined") return null;
  const value = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  return value && typeof value === "object" ? value : null;
}

export function getPlatform(): PlatformName {
  try {
    const name = cap()?.getPlatform?.();
    if (name === "ios" || name === "android") return name;
  } catch {
    /* ignore */
  }
  return "web";
}

export function isNativePlatform(): boolean {
  try {
    return cap()?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

export const isIOS = () => getPlatform() === "ios";
export const isAndroid = () => getPlatform() === "android";
export const isWeb = () => !isNativePlatform();

/** True when a specific Capacitor plugin is registered on this platform. */
export function isPluginAvailable(name: string): boolean {
  if (!isNativePlatform()) return false;
  try {
    return cap()?.isPluginAvailable?.(name) === true;
  } catch {
    return false;
  }
}

export function nativeFeaturesAvailable(): NativeCapability {
  const native = isNativePlatform();
  return {
    haptics: native && isPluginAvailable("Haptics"),
    nativeShare: native && isPluginAvailable("Share"),
    appLifecycle: native && isPluginAvailable("App"),
    statusBar: native && isPluginAvailable("StatusBar"),
    splashScreen: native && isPluginAvailable("SplashScreen"),
    nativeStorage: native && isPluginAvailable("Preferences"),
  };
}

/** Coarse mobile-device heuristic. Deliberately conservative, never exact. */
export function isLikelyMobileDevice(): boolean {
  if (isNativePlatform()) return true;
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  try {
    const coarse = window.matchMedia?.("(pointer: coarse)").matches === true;
    const touch = (navigator.maxTouchPoints ?? 0) > 0;
    const narrow = Math.min(window.innerWidth, window.innerHeight) <= 900;
    return coarse && touch && narrow;
  } catch {
    return false;
  }
}
