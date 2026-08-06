# Difficulty levels + Blitz instant spawn

Add a three-way difficulty setting (Beginner / Standard / Expert) that changes how fast targets appear and how long they stay, and make Blitz spawn the next target immediately after a scored tap.

## What changes for the player

**Difficulty picker on the home screen**, directly under the mode card: a three-segment chrome switch matching the current metallic UI. The choice is remembered between sessions and applies to every competitive mode (Classic, Blitz, Survival, Focus). Zen and the Reflex Trainer keep their own pacing and are unaffected.

- **Beginner** — targets appear a little slower and stay on screen ~25% longer. Gentle, still real gameplay.
- **Standard** — exactly today's pacing. This is the default, so nothing changes for existing players.
- **Expert** — targets appear sooner and vanish ~20% faster on top of the normal score-based ramp.

**XP is scaled to match the challenge** (best scores stay shared per mode, as decided): Beginner runs earn 0.7x XP, Standard 1x, Expert 1.3x. The XP breakdown on the game-over screen gains a line naming the difficulty multiplier so the number is never mysterious. Personal bests, achievements and daily challenges are untouched.

**Blitz becomes continuous**: the moment a target is tapped and scored, the next one appears — no gap. The tapped target still plays its brief fade-out on top, so the screen never looks empty. Misses and traps keep their existing short recovery pause so the penalty stays readable.

The difficulty in play is shown as a small label next to the difficulty bar in the in-game HUD, and on the game-over screen next to the mode name.

## Technical notes

- `src/game/difficulty.ts`: add a `Difficulty` type (`"beginner" | "standard" | "expert"`) and a `DIFFICULTY_PRESETS` record holding `durationScale`, `spawnScale`, `xpScale`, and a display label. Add optional scale arguments to `spawnDelayFor`.
- `src/game/modes.ts`: add `instantRespawnOnScore?: boolean`, set to `true` on `blitz` only.
- `src/game/useGame.ts`: accept `difficulty` in the hook options and keep it in a ref. Apply `spawnScale` at every `spawnDelayFor` call site and `durationScale` to the computed target `duration` (keeping the existing 420ms floor). In `resolveSuccess`, when the mode has `instantRespawnOnScore`, schedule the next spawn with delay `0` while leaving the exit-animation timer as-is.
- `src/game/progressStore.ts`: persist `difficulty` on the existing settings object with a `"standard"` fallback for saved data that lacks it — no storage-key changes, no progress reset.
- `src/game/useProgress.ts`: expose `difficulty` and a `setDifficulty` setter alongside the existing `setMode`.
- `src/game/xp.ts`: apply `xpScale` to the run total in `calculateXpRewards` and append a breakdown entry when the multiplier is not 1.
- `src/components/game/HomeScreen.tsx`: new `DifficultySwitch` built from the existing `ArcUI` primitives, placed under the mode card; wired through `src/routes/index.tsx`.
- `src/components/game/ScoreHeader.tsx` and `GameOverScreen.tsx`: show the active difficulty label.
