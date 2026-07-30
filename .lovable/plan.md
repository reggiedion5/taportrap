## Tagline color fix on Start screen

In `src/components/game/StartScreen.tsx` (lines 106–109), recolor the tagline so each phrase matches its meaning:

- "Green good." → `text-neon-green glow-green`
- "Red bad." → `text-neon-red glow-red`
- "Don't blink." → default `text-arcade-text` (white), removing the current neon-green override

Keep the existing base paragraph classes otherwise. No other screens or files change.