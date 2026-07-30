# App Store submission checklist

Work top to bottom. Anything marked **blocking** must be resolved before you can
upload a build for review.

## Configuration

- [ ] **blocking** `appId` in `capacitor.config.ts` (`com.reggiedion.taportrap`)
      is registered as a Bundle ID in your Apple Developer account. The value is
      set in the repo — registering it with Apple is a manual step.
- [ ] **blocking** `VITE_SUPPORT_EMAIL` in `.env` replaced with a monitored
      inbox (currently the placeholder `support@taportrap.app`).
- [x] `VITE_SUPPORT_URL` — served by this project at `/support`.
- [x] `VITE_PRIVACY_URL` — served by this project at `/privacy`.
- [x] `VITE_PRIVACY_EFFECTIVE_DATE` set.
- [x] `VITE_APP_VERSION` (1.0.0) / `VITE_APP_BUILD` (1) — match these in Xcode's
      Version and Build fields.
- [x] `capacitor.config.ts` contains no `server.url`.

> The support and privacy pages only resolve once the project is **published**.
> Publish before submitting the build for review.

Run **Settings → Developer diagnostics → Run release check** in a development
build to confirm all of the above automatically.

## Assets

- [x] 1024 × 1024 master app icon generated at `resources/app-icon-1024.png`
      (`docs/app-icon-spec.md`).
- [ ] **blocking** Icon dragged into Xcode's App Icon slot
      (`ios/App/App/Assets.xcassets/AppIcon.appiconset`).
- [ ] **blocking** Launch screen is a solid `#07080f` fill
      (`docs/launch-screen-spec.md`), then flip `LAUNCH_ASSET_VERIFIED` to
      `true` in `src/lib/appConfig.ts`.
- [ ] 6.7" iPhone screenshots (minimum 3) captured from a real run.
- [ ] 6.5" iPhone screenshots if you support older devices.

## Device testing

- [ ] Cold launch shows no white flash.
- [ ] Safe areas correct on a notched iPhone and on an iPhone SE.
- [ ] Portrait lock enforced; rotating a phone mid-run pauses rather than ends.
- [ ] Backgrounding mid-run pauses; returning requires an explicit resume tap.
- [ ] Incoming call / notification does not corrupt score or timer.
- [ ] Airplane mode: full launch and gameplay unaffected.
- [ ] Progress survives a force-quit and relaunch.
- [ ] Haptics respect the Vibration setting.
- [ ] Sound respects the Sound setting and the hardware mute switch behaviour.
- [ ] Share sheet opens; cancelling shows no error.
- [ ] Reset All Data clears progress and asks for confirmation first.
- [ ] Every interactive control is at least 44 × 44 pt.

## App Store Connect metadata

- [ ] Name: `Tap or Trap`
- [ ] Subtitle: `Tap fast. Think faster.`
- [ ] Category: Games → Arcade (secondary: Action)
- [ ] Age rating: 4+
- [ ] Description, keywords, promotional text written.
- [ ] Support URL and Privacy Policy URL match the configured values.

## App Privacy answers

Tap or Trap collects nothing. Answer the App Privacy questionnaire as:

- Data collection: **No, we do not collect data from this app.**
- No tracking, no third-party analytics, no advertising identifier.
- No account, no login, no user-generated content.
- Encryption: uses no non-exempt encryption (`ITSAppUsesNonExemptEncryption` =
  `NO`).

## Review notes to include

> Tap or Trap is a fully offline single-player reaction game. There is no
> account, no network activity, and no data collection. All progress is stored
> locally on the device and can be erased from Settings → Reset All Data.
