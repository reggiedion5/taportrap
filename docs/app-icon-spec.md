# App icon specification

Capacitor does not generate icons for you. Produce one master image and let
Xcode's single-size App Icon slot handle the rest.

The master image already exists in this repo at **`resources/app-icon-1024.png`**
— a neon-green target disc on the arcade navy `#07080f` field with a thin neon
red trap arc. Drag it into Xcode's App Icon slot.

## Master asset

| Property | Value |
| --- | --- |
| Size | 1024 × 1024 px |
| Format | PNG, no alpha channel, no transparency |
| Colour space | sRGB |
| Corners | Square — iOS applies the rounded mask itself |
| Source | `resources/app-icon-1024.png` |
| Destination | `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` |

## Design direction

Match the in-game identity rather than inventing a new one:

- Background: the deep arcade navy `#07080f`.
- Focal element: a single neon-green target disc, centred, roughly 62% of the
  canvas width, with the game's green `#4ef08a`-family glow.
- Optional accent: a thin neon-red arc on one edge to hint at the trap
  mechanic. Keep it subtle — the icon must read at 40 px.
- Do not put the words "Tap or Trap!" in the icon; the name renders beneath it.

## Checks before submitting

- Legible at 40 × 40 px (Spotlight) and 60 × 60 px (home screen).
- No transparency and no alpha channel — App Store Connect rejects both.
- No screenshots, device frames, or Apple hardware imagery.
- No text smaller than roughly 10% of the canvas height.
