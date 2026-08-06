import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, beforeEach } from "vitest";
import { releaseBodyScrollLock, setBodyScrollLock } from "@/lib/bodyScrollLock";

const root = process.cwd();
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

describe("body scroll lock", () => {
  beforeEach(() => {
    document.body.style.overflow = "";
  });

  it("locks while a run is on screen", () => {
    setBodyScrollLock(true);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("clears the lock on release", () => {
    setBodyScrollLock(true);
    releaseBodyScrollLock();
    expect(document.body.style.overflow).toBe("");
  });

  it("never latches hidden across nested lock/release cycles", () => {
    setBodyScrollLock(true);
    setBodyScrollLock(true);
    releaseBodyScrollLock();
    releaseBodyScrollLock();
    expect(document.body.style.overflow).toBe("");
  });
});

describe("native scroll structure", () => {
  const styles = read("src/styles.css");

  it("makes the document the primary vertical scroller", () => {
    expect(styles).toMatch(/overflow-y:\s*auto/);
    expect(styles).toMatch(/-webkit-overflow-scrolling:\s*touch/);
    expect(styles).toMatch(/overflow-x:\s*hidden/);
  });

  it("never disables touch on the document", () => {
    expect(styles).not.toMatch(/body\s*{[^}]*touch-action:\s*none/s);
  });

  it("exposes a scroll-screen utility with auto height", () => {
    expect(styles).toMatch(/@utility scroll-screen/);
    expect(styles).toMatch(/touch-action:\s*pan-y/);
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

  it("has no touchmove preventDefault outside gameplay", () => {
    const home = read("src/components/game/HomeScreen.tsx");
    const sheet = read("src/components/game/Sheet.tsx");
    expect(home).not.toMatch(/touchmove/);
    expect(sheet).not.toMatch(/touchmove/);
  });
});
