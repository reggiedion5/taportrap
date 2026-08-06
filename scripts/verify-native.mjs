/**
 * Verifies the generated Capacitor bundle in `native/www`.
 *
 * Checks:
 *  1. native/www/index.html exists and is a complete HTML document.
 *  2. index.html references JS and CSS assets, and every local reference exists.
 *  3. capacitor.config.ts configures no remote `server.url` for production.
 *
 * Usable standalone (`node scripts/verify-native.mjs`) or imported by
 * `build-native.mjs`.
 */
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "native", "www");
const INDEX = path.join(OUT_DIR, "index.html");

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}


export async function verifyNativeBundle() {
  const errors = [];

  if (!(await exists(INDEX))) {
    return { ok: false, errors: [`Missing ${path.relative(ROOT, INDEX)} — run "npm run build:native".`] };
  }

  const html = await readFile(INDEX, "utf8");
  for (const tag of ["<html", "<head", "<body"]) {
    if (!html.includes(tag)) errors.push(`index.html has no ${tag}> element.`);
  }

  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  const localRefs = refs.filter((r) => r.startsWith("/") && !r.startsWith("//"));
  if (!localRefs.some((r) => r.endsWith(".js"))) errors.push("index.html references no JS asset.");
  if (!localRefs.some((r) => r.endsWith(".css"))) errors.push("index.html references no CSS asset.");

  for (const ref of new Set(localRefs)) {
    const file = path.join(OUT_DIR, ref.split("?")[0]);
    if (!(await exists(file))) errors.push(`Referenced asset is missing from the bundle: ${ref}`);
  }

  const capacitorConfig = await readFile(path.join(ROOT, "capacitor.config.ts"), "utf8");
  if (/^\s*url\s*:/m.test(capacitorConfig)) {
    errors.push("capacitor.config.ts defines server.url — production builds must ship local assets only.");
  }

  return { ok: errors.length === 0, errors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { ok, errors } = await verifyNativeBundle();
  if (!ok) {
    console.error("✗ Native bundle verification failed:");
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  console.log("✓ native/www verified (assets, local server config)");
}
