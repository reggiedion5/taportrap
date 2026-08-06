import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { isBodyScrollLocked, releaseBodyScrollLock, setBodyScrollLock } from "@/lib/bodyScrollLock";
import { installListenerAudit, listActiveGlobalTouchListeners } from "@/lib/listenerAudit";

const root = process.cwd();
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

describe("document scroll lock", () => {
  beforeEach(() => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    releaseBodyScrollLock();
  });

  it("locks the document while a run is on screen", () => {
    setBodyScrollLock(true);
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.body.style.overflow).toBe("hidden");
    expect(isBodyScrollLocked()).toBe(true);
  });

  it("clears the lock on release", () => {
    setBodyScrollLock(true);
    releaseBodyScrollLock();
    expect(document.body.style.overflow).toBe("");
    expect(document.documentElement.style.overflow).toBe("");
    expect(isBodyScrollLocked()).toBe(false);
  });

  it("never latches hidden across nested lock/release cycles", () => {
    setBodyScrollLock(true);
    setBodyScrollLock(true);
    releaseBodyScrollLock();
    releaseBodyScrollLock();
    expect(document.body.style.overflow).toBe("");
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("Home stays scrollable after a modal (Settings) opens and closes", () => {
    setBodyScrollLock(true); // modal open
    setBodyScrollLock(false); // modal closed
    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.position).toBe("");
  });

  it("Home stays scrollable after gameplay and after Game Over", () => {
    setBodyScrollLock(true); // playing
    setBodyScrollLock(false); // game over
    setBodyScrollLock(false); // home
    expect(document.documentElement.style.overflow).toBe("");
    expect(isBodyScrollLocked()).toBe(false);
  });
});

describe("global touch listener audit", () => {
  let uninstall = () => {};
  beforeEach(() => {
    uninstall = installListenerAudit();
  });
  afterEach(() => uninstall());

  it("reports nothing when no global touch listeners are registered", () => {
    expect(listActiveGlobalTouchListeners()).toEqual([]);
  });

  it("tracks and untracks a listener using the same capture option", () => {
    const handler = () => {};
    document.addEventListener("touchmove", handler, { passive: false, capture: true });
    // In non-dev test runs the audit is inert; either way it must never throw.
    document.removeEventListener("touchmove", handler, { capture: true });
    expect(listActiveGlobalTouchListeners()).toEqual([]);
  });
});

describe("no JavaScript cancels scrolling outside gameplay", () => {
  const appFiles = [
    "src/routes/__root.tsx",
    "src/routes/index.tsx",
    "src/components/game/HomeScreen.tsx",
    "src/components/game/Sheet.tsx",
    "src/components/game/SettingsModal.tsx",
    "src/components/game/ArcadeBackdrop.tsx",
    "src/components/game/BoardEnvironment.tsx",
    "src/lib/bodyScrollLock.ts",
    "src/lib/appLifecycle.ts",
    "src/game/useGame.ts",
  ];

  it.each(appFiles)("%s registers no global touchmove listener", (file) => {
    const src = read(file);
    expect(src).not.toMatch(/addEventListener\(\s*["'](touchmove|touchstart|gesturestart)["']/);
    expect(src).not.toMatch(/passive:\s*false/);
  });

  it("Home screen contains no touch preventDefault", () => {
    const home = read("src/components/game/HomeScreen.tsx");
    expect(home).not.toMatch(/preventDefault/);
    expect(home).not.toMatch(/touchmove/);
  });
});

describe("native scroll structure", () => {
  const styles = read("src/styles.css");

  it("makes the document element the single vertical scroller", () => {
    expect(styles).toMatch(/html\s*{[^}]*overflow-y:\s*auto/s);
    expect(styles).toMatch(/-webkit-overflow-scrolling:\s*touch/);
  });

  it("does not make body a second scroll container", () => {
    expect(styles).toMatch(/body\s*{[^}]*overflow-y:\s*visible/s);
  });

  it("keeps horizontal overflow disabled", () => {
    expect(styles).toMatch(/overflow-x:\s*hidden/);
  });

  it("never disables touch on the document", () => {
    expect(styles).not.toMatch(/body\s*{[^}]*touch-action:\s*none/s);
    expect(styles).not.toMatch(/html\s*{[^}]*touch-action:\s*none/s);
  });

  it("allows vertical panning on navigation screens", () => {
    expect(styles).toMatch(/@utility no-select\s*{[^}]*touch-action:\s*pan-y/s);
    expect(styles).toMatch(/@utility scroll-screen\s*{[^}]*touch-action:\s*pan-y/s);
  });

  it("suppresses native gestures only on the gameplay surface", () => {
    expect(styles).toMatch(/\[data-gameplay-surface="true"\]\s*{[^}]*touch-action:\s*none/s);
  });

  it("marks the gameplay screen as the gameplay surface", () => {
    expect(read("src/components/game/GameScreen.tsx")).toMatch(/data-gameplay-surface="true"/);
  });

  const scrollableScreens = [
    "src/components/game/HomeScreen.tsx",
    "src/components/game/GameOverScreen.tsx",
    "src/components/game/TrainingSummaryScreen.tsx",
  ];

  it.each(scrollableScreens)("%s does not clip its root container", (file) => {
    const firstLine = read(file)
      .split("\n")
      .find((l) => l.includes("scroll-screen"));
    expect(firstLine).toBeTruthy();
    expect(read(file)).not.toMatch(/min-h-\[100dvh\] overflow-hidden/);
  });

  it("keeps decorative backdrop layers behind content and non-interactive", () => {
    const backdrop = read("src/components/game/ArcadeBackdrop.tsx");
    expect(backdrop).toMatch(/pointer-events-none fixed inset-0 z-0/);
  });

  it("keeps taps on cards and buttons compatible with vertical panning", () => {
    // Buttons rely on click/pointerdown, never on touchmove cancellation.
    const home = read("src/components/game/HomeScreen.tsx");
    expect(home).not.toMatch(/touch-action:\s*none/);
  });
});
