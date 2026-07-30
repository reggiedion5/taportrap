# Tap or Trap — iOS packaging guide

Tap or Trap ships as a Capacitor-wrapped web app. The native container loads a
fully bundled static copy of the game: there is no server URL, no network call
at runtime, and no account system. Everything below can be prepared on any
machine; only the final archive requires macOS and Xcode.

## 1. Prerequisites

| Requirement | Notes |
| --- | --- |
| macOS + Xcode 15 or newer | Required for `cap open ios`, simulators and archiving |
| Node 20+ | Used for the web and native bundle builds |
| Apple Developer Program membership | Required for TestFlight and App Store distribution |
| CocoaPods | Installed automatically by Capacitor on first `cap sync` |

## 2. Configure the release values

Set these build-time variables (`.env` locally, or your CI environment) before
producing a build you intend to submit. All of them are optional for local play;
the related buttons stay disabled while a value is missing.

```
VITE_APP_VERSION=1.0.0
VITE_APP_BUILD=1
VITE_SUPPORT_EMAIL=support@yourdomain.com
VITE_SUPPORT_URL=https://yourdomain.com/support
VITE_PRIVACY_URL=https://yourdomain.com/privacy
VITE_PRIVACY_EFFECTIVE_DATE=2026-01-01
VITE_APP_STORE_URL=            # add once the listing exists
```

Confirm the bundle identifier in `capacitor.config.ts` (`appId`). The value
`com.reggiedion.taportrap` is a suggestion — it must match an identifier you own
in your Apple Developer account.

## 3. Build the native bundle

```bash
npm install
npm run build:native   # writes native/www (fully static, offline-ready)
npx cap add ios        # first time only
npm run ios:sync       # rebuilds native/www and syncs it into ios/
npm run ios:open       # opens the Xcode workspace
```

`native/www` is generated output. Rebuild it any time the web app changes —
Capacitor copies whatever is in that folder into the app bundle.

## 4. Xcode settings to verify

1. **Signing & Capabilities** — select your team; let Xcode manage signing.
2. **General → Identity** — `Display Name: Tap or Trap`, and confirm
   `Version`/`Build` match `VITE_APP_VERSION` / `VITE_APP_BUILD`.
3. **Deployment Info** — iPhone only, `Portrait` orientation only. Uncheck both
   landscape options; the game is designed for portrait.
4. **App Icons** — add the 1024×1024 master icon (see `docs/app-icon-spec.md`).
5. **Launch Screen** — see `docs/launch-screen-spec.md`.
6. **Info.plist** — `UIViewControllerBasedStatusBarAppearance` should be `NO`,
   and the status bar style dark-content-on-dark is handled at runtime.

## 5. Test on a device

Run on a physical iPhone before submitting and verify:

- The splash screen hands off to the game with no white flash.
- Content clears the notch/Dynamic Island and the home indicator on a notched
  device, and looks correct on a non-notched device (SE).
- Backgrounding the app mid-run pauses it, and returning requires an explicit
  tap to resume.
- Airplane mode: the game launches and plays exactly the same.
- Force-quitting and relaunching preserves scores, XP and achievements.
- Haptics fire on taps and stop entirely when Vibration is turned off.
- Share from the game-over screen opens the native share sheet, and cancelling
  it shows no error.

## 6. Archive and upload

1. Select **Any iOS Device (arm64)** as the destination.
2. **Product → Archive**.
3. In the Organizer, **Distribute App → App Store Connect → Upload**.
4. In App Store Connect, add the build to TestFlight for internal testing first.

## 7. App Review notes

- The game is fully offline and stores data only on the device.
- No account, login, or user-generated content.
- No tracking, analytics, advertising identifiers, or third-party SDKs.
- Suggested age rating: 4+.

Run **Settings → Developer diagnostics → Run release check** in a development
build to list any configuration item still outstanding.
