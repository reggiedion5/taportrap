# Launch screen specification

The launch screen is a static iOS asset — it cannot run app code. Its only job
is to make the transition into the game invisible.

## Requirement

The launch screen must be a solid fill of the app's deep background colour,
`#07080f`, edge to edge, with no logo, no spinner, and no text.

The app then paints its own branded boot screen (the neon "TAP OR TRAP!"
wordmark) as soon as the WebView is ready, and hides the native splash only
after storage, preferences and the selected theme are applied. Adding artwork to
the native launch screen would create a visible double-logo flash.

## Xcode setup

1. Open `ios/App/App/Base.lproj/LaunchScreen.storyboard`.
2. Select the root view and set its background colour to
   `#07080f` (sRGB `7, 8, 15`).
3. Delete any image view or label Capacitor scaffolded in.
4. Confirm constraints pin the view to the superview edges, not the safe area,
   so the colour extends under the notch and home indicator.

## Verification

- No white flash on cold launch, on a device (simulators can mask this).
- The colour matches the first frame of the app — hold a screenshot of the boot
  screen next to the launch screen and confirm the background is identical.
- Correct on both a notched iPhone and a non-notched iPhone SE.
