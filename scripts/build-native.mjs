/**
 * Produces a fully static web bundle for the Capacitor iOS app.
 *
 * Deterministic: no dev/preview server, no localhost fetching. `NATIVE_BUILD=1`
 * makes vite skip the nitro server target and prerender the app routes to real
 * HTML (see vite.config.ts). The prerendered client output in `dist/client` is
 * copied verbatim into `native/www`, which is Capacitor's `webDir`.
 *
 * Runs on any machine with Node — it does not require macOS or Xcode.
 */
import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { verifyNativeBundle } from "./verify-native.mjs";

const ROOT = process.cwd();
const CLIENT_DIR = path.join(ROOT, "dist", "client");
const OUT_DIR = path.join(ROOT, "native", "www");

function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: { ...process.env, ...env },
    });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)),
    );
    child.on("error", reject);
  });
}

async function main() {
  console.log("› Building static (prerendered) bundle…");
  await rm(CLIENT_DIR, { recursive: true, force: true });
  await run("npx", ["vite", "build"], { NATIVE_BUILD: "1" });

  const prerendered = path.join(CLIENT_DIR, "index.html");
  if (!existsSync(prerendered)) {
    throw new Error(
      `Prerender did not produce ${prerendered}. Check the "prerender" options in vite.config.ts.`,
    );
  }

  console.log("› Copying assets into native/www…");
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  await cp(CLIENT_DIR, OUT_DIR, { recursive: true });
  // `_headers` is a hosting artifact and has no meaning inside the app bundle.
  await rm(path.join(OUT_DIR, "_headers"), { force: true });

  const result = await verifyNativeBundle();
  if (!result.ok) {
    throw new Error(`Native bundle verification failed:\n  - ${result.errors.join("\n  - ")}`);
  }

  const size = (await readFile(path.join(OUT_DIR, "index.html"), "utf8")).length;
  console.log(`✓ native/www ready (index.html ${size} bytes, all checks passed)`);
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  process.exit(1);
});
