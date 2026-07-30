## Goal
Make the label text inside the tutorial demo circles (TAP, TRAP, BONUS, ×2) easy to read on mobile.

## Problem
In `src/components/game/OnboardingFlow.tsx` the demo circles render their label with `sticker-sm text-sm`. That utility applies the Space Mono sticker treatment (heavy outline/offset shadow, tight tracking) at a very small size, which smears the letters inside the colored circle — visible in the screenshots.

## Change (single file: `src/components/game/OnboardingFlow.tsx`)
- Drop `sticker-sm` from the demo label span; use the plain display font with `font-black` and wider letter spacing instead of the outlined sticker style.
- Scale the labels up and match the in-game `Target` sizing logic:
  - TAP / TRAP: ~22px
  - BONUS: ~17px (slightly smaller so it fits the circle)
  - ×2: ~32px, notably larger
- Enlarge the demo circles a step (from `size-24` to roughly `size-28`) so the larger text has breathing room.
- Keep existing colors, contrast pairings (dark text on green/gold, light text on red/purple), and the pop-in animation.

No changes to game logic, scoring, or other screens.