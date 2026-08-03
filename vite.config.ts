// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * `NATIVE_BUILD=1` switches the build into "static bundle for Capacitor" mode:
 * nitro (the server deploy target) is skipped and TanStack Start prerenders "/"
 * into `dist/client/index.html`, which `scripts/build-native.mjs` copies to
 * `native/www`. The normal Lovable web build is untouched when the flag is off.
 */
const isNativeBuild = process.env["NATIVE_BUILD"] === "1";

export default defineConfig({
  nitro: isNativeBuild ? false : undefined,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    ...(isNativeBuild
      ? {
          // No top-level `enabled: true` — that opts every route in and makes the
          // prerenderer fetch /privacy and /support too. Only "/" is opted in here.
          prerender: { crawlLinks: false, failOnError: true },
          pages: [{ path: "/", prerender: { enabled: true, crawlLinks: false } }],
        }
      : {}),

  },
});
