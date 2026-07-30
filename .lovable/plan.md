## Goal

Replace the generic default typeface (the grey body/description text) with a distinctive arcade pairing: **Space Mono** for headings/labels, **Rubik** for body copy.

## Changes

1. **`src/routes/__root.tsx`** — swap the Google Fonts `<link>` from Space Grotesk to `Space+Mono:wght@400;700` and `Rubik:wght@400;500;700;900`.

2. **`src/styles.css`**
   - Add `--font-mono-display: "Space Mono", ui-monospace, monospace;` and set `--font-display: "Rubik", ui-sans-serif, system-ui, sans-serif;` in the `@theme` block.
   - Keep `body { font-family: var(--font-display) }` so all body/grey text becomes Rubik.
   - Point the sticker/label styles (`.sticker-sm`, tracking-heavy uppercase labels like SCORE, HIGH SCORE, REACTION ARCADE) at Space Mono so the HUD reads like an arcade cabinet.
   - Leave `.sticker-text` big headline treatment on the heavy Rubik weight (900) so "Tap or Trap" keeps its chunky sticker look with glow/outline intact.

3. No component logic changes — only font tokens and the two utility classes, so every screen (Start, HUD, Pause, Settings, Game Over) picks it up automatically.

## Verification

Screenshot the start screen and game screen at mobile width to confirm the mono labels stay legible and nothing wraps or overflows.
