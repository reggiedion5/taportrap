# App Store submission checklist

Work top to bottom. Anything marked **blocking** must be resolved before you can
upload a build for review.

## Configuration

- [ ] **blocking** `appId` in `capacitor.config.ts` matches an identifier you
      own in your Apple Developer account.
- [ ] **blocking** `VITE_SUPPORT_EMAIL` points at a monitored inbox.
- [ ] **blocking** `VITE_SUPPORT_URL` is a live HTTPS support page.
- [ ] **blocking** `VITE_PRIVACY_URL` is a live HTTPS privacy policy.
- [ ] **blocking** `VITE_PRIVACY_EFFECTIVE_DATE` is set.
- [ ] `VITE_APP_VERSION` / `VITE_APP_BUILD` match Xcode's Version and Build.
- [ ] `capacitor.config.ts` contains no `server.url`.

Run **Settings → Developer diagnostics → Run release check** in a development
build to confirm all of the above automatically.

## Assets

- [ ] **blocking** 1024 × 1024 app icon added (`docs/app-icon-spec.md`).
- [ ] **blocking** Launch screen is a solid `#07080f` fill
      (`docs/launch-screen-spec.md`).
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
