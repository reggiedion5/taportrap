import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Tap or Trap — Capacitor configuration.
 *
 * ⚠️ CHANGE BEFORE THE FIRST XCODE ARCHIVE:
 *   `appId` must match the bundle identifier registered in your Apple Developer
 *   account. The value below is a suggestion, not a reserved identifier.
 *
 * `webDir` points at `native/www`, produced by `npm run build:native`. That
 * folder is a fully static snapshot of the app, so the iOS build loads bundled
 * local assets only — there is deliberately no `server.url` here.
 */
const config: CapacitorConfig = {
  appId: "com.reggiedion.taportrap",
  appName: "Tap or Trap",
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
    scrollEnabled: false,
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
