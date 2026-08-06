# Fix the pause screen: "Back In" and "Quit Game" not working

## What I checked

I drove the running app in a headless browser: paused mid-run, and both overlay buttons are present, hit-testable, and work with a mouse (resume returned to play, no JS errors). So the failure is specific to the real device/touch environment, not the button wiring.

Reading the code, two mechanisms can produce exactly what you describe, and both are plausible on touch:

1. `src/lib/appLifecycle.ts` treats a plain `window` **blur** as "app went to background" and fires a system pause. On a WebView, focus changes around a tap can fire blur, so the moment you resume, the run is paused again — it looks like "Back In does nothing".
2. The pause overlay is rendered **inside the play-area box** in `GameScreen.tsx` (z-30, inside a clipped `overflow-hidden` container). If any sibling layer (flash/urgent/orientation layers, or the safe-area inset) sits over it on the device, taps land on the wrong element — which would also explain Quit not responding.

## Plan

1. **Harden the background detection** (`src/lib/appLifecycle.ts`)
   - Ignore `window.blur` when `document.visibilityState === "visible"`; rely on `visibilitychange`, `pagehide`, and the Capacitor app-state listeners only.
   - Add a short cool-down so a background event cannot re-pause within ~500 ms of an explicit resume.

2. **Make the pause overlay a true top-level layer** (`PauseOverlay.tsx` + `GameScreen.tsx`)
   - Render it `fixed inset-0` at the highest z-index (above flash/urgent layers), outside the clipped play-area box, with `safe-screen` padding so buttons never sit under the notch/home indicator.
   - Buttons get explicit `touch-action: manipulation`, `pointer-events: auto`, and a minimum 56 px tap height.

3. **Make resume/quit failure-proof** (`src/game/useGame.ts`)
   - Wrap `resumeAudio()` / music calls in try-catch so an audio error can never abort the phase change.
   - `resume()` and `quitRun()` set the phase first, then do side effects.
   - `quitRun()` also works from any phase (not just playing/paused) so Quit always lands back on Home.

4. **Avoid the orientation re-pause loop** (`GameScreen.tsx`)
   - Only auto-pause on the rotate guard when it *becomes* true, instead of on every render where it is true, so it can't immediately re-pause after you resume.

5. **Verify**
   - Re-test pause → Back In and pause → Quit in the browser (touch emulation), then rebuild the native bundle so the fix ships to iOS.

## Notes

No gameplay, scoring, progression, or visual styling changes — only overlay layering and lifecycle/event handling.
