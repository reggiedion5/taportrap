# Background Music

Add catchy arcade background music with its own on/off switch in Settings, on by default.

## What players get

- A looping chiptune soundtrack, composed in code (no downloads, works offline in the iOS build).
- Two moods: a calmer loop on the home/menu screens, and a faster driving loop during a run that subtly speeds up as difficulty rises.
- A "Music" toggle in Settings, separate from the existing Sound (blips), Haptic feedback and Screen shake toggles.
- Music sits under the sound effects in volume so taps and traps stay clearly audible.
- Music pauses when the game pauses, when the app goes to the background, and stops on game over; it fades rather than cutting abruptly.

## How it works

New `src/game/music.ts` built on the same Web Audio context as `src/game/audio.ts`:

- A small step sequencer (bass line, arpeggio lead, hi-hat/noise percussion) scheduled ahead on a lookahead timer, so it loops seamlessly without audio files.
- Two patterns: `menu` (slower tempo, mellow) and `game` (higher tempo, added percussion). Gameplay tempo scales with the current difficulty tier.
- Exposes `setMusicEnabled`, `playTrack("menu" | "game")`, `setIntensity(level)`, `stopMusic`, `suspendMusic`, `resumeMusic`. All calls are no-ops when disabled or when Web Audio is unavailable, and every path fails silently.
- A dedicated gain node with a short fade-in/fade-out so track changes are smooth.

Settings wiring, mirroring the existing `screenShake` flag:

- Add `music: boolean` to `GameSettings` (`src/game/types.ts`), default `true` in `DEFAULT_SETTINGS`, parsed with `safeBool` in `src/game/storage.ts` so existing saved settings migrate without loss.
- Add a "Music" toggle to `SettingsModal` under Sound.
- `src/game/useGame.ts` calls `setMusicEnabled` alongside the existing `setSoundEnabled` on hydration and on every settings change, starts the game track when a run begins, switches back to the menu track on home/game-over, stops on pause, and hooks the existing app-lifecycle suspend/resume bus.

Constraints kept: music only starts after a user gesture (reusing the existing `unlockAudio` unlock path, required by iOS), no new dependencies, no new assets, no gameplay or scoring changes.

## Out of scope

- Volume sliders or track selection.
- Music in the Reflex Trainer screens (can be added later if wanted).
