## Goal

Clear every outstanding item in the in-app release check that can be cleared from inside this project, and leave only the two steps that genuinely require your Apple Developer account and Xcode.

Since the release check demands live HTTPS support and privacy pages, the simplest reliable option is to host them in the app itself rather than depend on an external site.

## What gets built

**1. Live support + privacy pages (new routes)**
- `/support` — short page: what the game is, that it's fully offline, common issues (progress lost, sound/haptics, rotation), and an email contact line. Styled with the existing arcade tokens, not a new look.
- `/privacy` — the content of `docs/privacy-policy.md` rendered as a real page with the effective date shown.
- Both get their own `head()` titles/descriptions, and both are reachable from Settings (already wired — they just point at real URLs now).

**2. Release configuration values**
Create `.env` with:
- `VITE_SUPPORT_URL` / `VITE_PRIVACY_URL` → the published project URL + `/support` and `/privacy`
- `VITE_SUPPORT_EMAIL` → a placeholder mailbox you can swap in one line
- `VITE_PRIVACY_EFFECTIVE_DATE` → today's date
- `VITE_APP_VERSION=1.0.0`, `VITE_APP_BUILD=1`

Keep `appId` as `com.reggiedion.taportrap` in `capacitor.config.ts`, and update the docs to state plainly that this exact string must be registered in App Store Connect before the first archive.

**3. App icon**
Generate the 1024 × 1024 master per `docs/app-icon-spec.md` — deep navy `#07080f` field, centred neon-green target disc with glow, subtle neon-red trap arc — saved into the repo at the path Xcode expects, no alpha, sRGB.

**4. Release check accuracy**
`validateRelease()` currently requires `appIconPresent` / `launchAssetPresent` to be passed in and always reports them as failing. Change the caller in `SettingsModal` to pass the real state: icon present (true once generated), launch screen flagged from a single constant you flip after verifying it in Xcode. Also pass `nativeServerUrl` from the actual Capacitor config so that check reflects reality instead of an assumption.

**5. Checklist refresh**
Tick the now-satisfied lines in `docs/app-store-checklist.md` and reduce the remaining blocking list to the two real ones.

## Technical notes

- New routes live at `src/routes/support.tsx` and `src/routes/privacy.tsx`; content is static, no server functions, so they prerender fine and stay offline-safe. The native snapshot build only bundles the game route, so these pages are web-only — that's correct, since App Review fetches them over the internet.
- `.env` values are build-time `VITE_*` reads already handled by `src/lib/appConfig.ts`; no code changes needed there.
- The support/privacy URLs only become live after you publish the project. I'll set them to the stable project URL so they resolve as soon as you hit publish.

## What still needs you

- Registering `com.reggiedion.taportrap` in your Apple Developer account.
- Dropping the generated icon into the Xcode asset catalog and confirming the launch screen, then flipping the launch-asset flag.
- Swapping the placeholder support email for your real monitored inbox (one line in `.env`).
