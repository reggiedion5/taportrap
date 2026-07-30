## Goal

Make every screen's text louder and more fun: chunky sticker-style lettering with neon glow and light motion, plus snappier copy.

## Design system additions (src/styles.css)

New reusable text utilities so the treatment stays consistent:
- `.sticker-text` — heavy weight, tighter tracking, hard offset shadow + dark outline (via `-webkit-text-stroke` / layered `text-shadow`) for the comic-sticker feel.
- `.neon-glow-green` / `-red` / `-gold` / `-purple` — colored `text-shadow` halos tied to existing neon tokens.
- `.title-shimmer` — slow animated gradient sweep across the hero title.
- `.wiggle` — subtle infinite tilt for accent words; `.pop-word` — spring-in entrance for staggered word reveals.
- All motion respects `prefers-reduced-motion`.

## Start screen

- Hero: "Tap" green + glow, "or" white and smaller/rotated, "Trap" red + glow — each word sticker-styled with slight opposing rotation and a staggered pop-in on mount; "Trap" gets a slow wiggle.
- Section eyebrow, rule titles, HIGH SCORE label, and Start button get sticker weight and tracking; high-score number gets a gold glow.
- Copy punch-up (tagline, rule details, how-to-play text) — e.g. tagline "Green good. Red bad. Don't blink.", Red rule "Hands off. Let it die.", Purple "Two taps, fast — or you're done."

## In-game screen

- Score and combo numbers get sticker weight + glow; combo multiplier text pulses when it levels up.
- Floating feedback popups (PERFECT / FAST / GOOD, +points) get sticker outline and color-matched glow so they read against the backdrop.
- Punchier feedback words where appropriate (e.g. "PERFECT!", "NICE", "TOO SLOW").

## Game over screen

- Headline becomes a big sticker-styled reaction line driven by the mistake reason (e.g. "TRAPPED!", "TOO SLOW!", "ONE TAP SHORT!") with red glow and a shake-in entrance.
- Final score huge with gold glow; stat labels sticker-cased; new-high-score line gets shimmer.
- Buttons restyled to match the Start button's punch.

## Notes

Pure presentation change — no gameplay logic, scoring, or state changes. Only `src/styles.css` and the game component files' text/classNames are touched.
