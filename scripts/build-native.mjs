/**
 * Produces a fully static web bundle for the Capacitor iOS app.
 *
 * The web deployment is server-rendered, but the native app must ship bundled
 * local assets with no remote server URL. This script builds the app normally,
 * boots the built preview server locally, snapshots "/" to index.html and
 * writes everything to `native/www`.
 *
 * Runs on any machine with Node — it does not require macOS or Xcode.
 */
import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CLIENT_DIR = path.join(ROOT, "dist", "client");
const OUT_DIR = path.join(ROOT, "native", "www");
const PORT = 4183;

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: process.platform === "win32" });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)),
    );
    child.on("error", reject);
  });
}

async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.text();
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Preview server did not respond at ${url}`);
}

async function main() {
  console.log("› Building web bundle…");
  await run("npm", ["run", "build"]);

  if (!existsSync(CLIENT_DIR)) {
    throw new Error(`Expected client assets at ${CLIENT_DIR}`);
  }

  console.log("› Snapshotting the app shell…");
  const preview = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
    stdio: "ignore",
    shell: process.platform === "win32",
  });

  let html;
  try {
    html = await waitForServer(`http://localhost:${PORT}/`);
  } finally {
    preview.kill("SIGTERM");
  }

  if (!html || !html.includes("<html")) {
    throw new Error("Snapshot did not return an HTML document");
  }

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  await cp(CLIENT_DIR, OUT_DIR, { recursive: true });
  // `_headers` is a hosting artifact and has no meaning inside the app bundle.
  await rm(path.join(OUT_DIR, "_headers"), { force: true });
  await writeFile(path.join(OUT_DIR, "index.html"), html, "utf8");

  const size = (await readFile(path.join(OUT_DIR, "index.html"), "utf8")).length;
  console.log(`✓ native/www ready (index.html ${size} bytes)`);
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  process.exit(1);
});
