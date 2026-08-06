import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Tap or Trap! — Capacitor configuration.
 *
 * ⚠️ REGISTER BEFORE THE FIRST XCODE ARCHIVE:
 *   `appId` below is the identifier this project ships with. It must be
 *   registered as a Bundle ID in your Apple Developer account (Certificates,
 *   Identifiers & Profiles → Identifiers → +) and selected in Xcode's Signing
 *   & Capabilities tab. Do not change the string here unless you also change
 *   `SUGGESTED_BUNDLE_ID` in `src/lib/appConfig.ts`.
 *
 * `webDir` points at `native/www`, produced by `npm run build:native`. That
 * folder is a fully static snapshot of the app, so the iOS build loads bundled
 * local assets only — there is deliberately no `server.url` here.
 */
const config: CapacitorConfig = {
  appId: "com.reggiedion.taportrap",
  appName: "Tap or Trap!",
  webDir: "native/www",
  // Restrict in-WebView navigation to the bundled app itself.
  server: {
    androidScheme: "https",
    iosScheme: "capacitor",
    allowNavigation: [],
    cleartext: false,
  },
  ios: {
    contentInset: "never",
    backgroundColor: "#07080f",
    limitsNavigationsToAppBoundDomains: true,
    scrollEnabled: true,
  },
  android: {
    backgroundColor: "#07080f",
  },
  plugins: {
    SplashScreen: {
      // The app hides the splash itself once storage, preferences and the theme
      // are ready (see AppBootstrap), so autohide stays off.
      launchAutoHide: false,
      launchShowDuration: 0,
      backgroundColor: "#07080fff",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
      backgroundColor: "#07080f",
    },
  },
};

export default config;
