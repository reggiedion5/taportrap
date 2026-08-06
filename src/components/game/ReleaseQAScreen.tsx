import { useMemo, useState } from "react";
import { GAME_FEATURES, qaScreenVisible } from "@/config/gameFeatures";
import {
  APP_BUILD,
  APP_NAME,
  APP_VERSION,
  IS_DEV,
  NATIVE_SERVER_URL,
  PRIVACY_URL,
  SUPPORT_EMAIL,
  SUPPORT_URL,
} from "@/lib/appConfig";
import { analyticsEnabled, recentAnalyticsEvents } from "@/lib/analytics";
import { checkStorageAvailability } from "@/lib/storageHealth";
import { formatReleaseReport, validateRelease } from "@/lib/releaseValidation";
import { isNativePlatform } from "@/lib/nativePlatform";
import { exportProgressText, validateImport } from "@/game/backup";
import { loadProgress } from "@/game/progressStore";
import { Sheet } from "./Sheet";

type Status = "pass" | "warn" | "fail";

interface Check {
  label: string;
  status: Status;
  detail: string;
}

const TONE: Record<Status, string> = {
  pass: "text-neon-green",
  warn: "text-neon-gold",
  fail: "text-neon-red",
};

const BANNED_NAMES = ["Tap or Trap Blitz", "Tap or Trap Game"];

interface ReleaseQAScreenProps {
  open: boolean;
  onResetOnboarding: () => void;
  onThrowTestError: () => void;
  onClose: () => void;
}

/**
 * Development-only release checklist. `qaScreenVisible()` is false in every
 * non-dev build, so this never reaches production navigation.
 */
export function ReleaseQAScreen({
  open,
  onResetOnboarding,
  onThrowTestError,
  onClose,
}: ReleaseQAScreenProps) {
  const [log, setLog] = useState<string | null>(null);

  const checks = useMemo<Check[]>(() => {
    if (!open) return [];
    const rows: Check[] = [];

    rows.push({
      label: "Branding",
      status: APP_NAME === "Tap or Trap!" && !BANNED_NAMES.includes(APP_NAME) ? "pass" : "fail",
      detail: `App name resolves to "${APP_NAME}"`,
    });
    rows.push({
      label: "Version metadata",
      status: APP_VERSION && APP_BUILD ? "pass" : "fail",
      detail: `Version ${APP_VERSION} (${APP_BUILD})`,
    });
    rows.push({
      label: "Native server URL",
      status: NATIVE_SERVER_URL === "" ? "pass" : "fail",
      detail: NATIVE_SERVER_URL === "" ? "Empty — bundle is served locally" : NATIVE_SERVER_URL,
    });

    const storage = checkStorageAvailability();
    rows.push({
      label: "Storage",
      status: storage === "available" ? "pass" : "warn",
      detail: `localStorage: ${storage}`,
    });

    let migration: Status = "pass";
    let migrationDetail = "Profile loads and validates";
    try {
      const snapshot = loadProgress();
      migrationDetail = `Level ${snapshot.profile.level}, ${snapshot.statistics.gamesPlayed} games, schema v${snapshot.profile.version}`;
    } catch (error) {
      migration = "fail";
      migrationDetail = String(error);
    }
    rows.push({ label: "Profile migration", status: migration, detail: migrationDetail });

    const backupOk = validateImport(exportProgressText(APP_VERSION)).ok;
    rows.push({
      label: "Export / import round trip",
      status: backupOk ? "pass" : "fail",
      detail: backupOk ? "Export validates as an importable backup" : "Round trip failed",
    });

    rows.push({
      label: "Support URL",
      status: SUPPORT_URL ? "pass" : "warn",
      detail: SUPPORT_URL || "Not configured — support links hidden",
    });
    rows.push({
      label: "Support email",
      status: SUPPORT_EMAIL ? "pass" : "warn",
      detail: SUPPORT_EMAIL || "Not configured — Copy Report used instead",
    });
    rows.push({
      label: "Privacy URL",
      status: PRIVACY_URL ? "pass" : "warn",
      detail: PRIVACY_URL || "Not configured — in-app Privacy screen used",
    });

    rows.push({
      label: "Offline status",
      status:
        typeof navigator === "undefined" || navigator.onLine !== false
          ? "pass"
          : ("warn" as Status),
      detail:
        typeof navigator === "undefined"
          ? "No navigator"
          : navigator.onLine === false
            ? "Offline — core game must still run"
            : "Online",
    });
    rows.push({
      label: "Audio",
      status: typeof window !== "undefined" && "AudioContext" in window ? "pass" : "warn",
      detail: "Web Audio generated locally, no remote assets",
    });
    rows.push({
      label: "Haptics",
      status: isNativePlatform() ? "pass" : "warn",
      detail: isNativePlatform()
        ? "Capacitor Haptics available"
        : "Web build — haptics fail silently",
    });
    rows.push({
      label: "Share",
      status:
        typeof navigator !== "undefined" && typeof navigator.share === "function" ? "pass" : "warn",
      detail: "Falls back to clipboard when unavailable",
    });
    rows.push({
      label: "Analytics",
      status: analyticsEnabled() ? "warn" : "pass",
      detail: analyticsEnabled()
        ? "Enabled — verify the privacy copy"
        : "Disabled, no network events",
    });

    return rows;
  }, [open]);

  if (!qaScreenVisible()) return null;

  const counts = checks.reduce(
    (acc, c) => ({ ...acc, [c.status]: acc[c.status] + 1 }),
    { pass: 0, warn: 0, fail: 0 } as Record<Status, number>,
  );

  return (
    <Sheet open={open} title="Release QA (dev only)" onClose={onClose}>
      <p className="ui-body text-[15px] text-arcade-muted">
        {counts.pass} pass · {counts.warn} warning · {counts.fail} fail
      </p>

      <div className="mt-4 grid gap-2">
        {checks.map((check) => (
          <div key={check.label} className="rounded-xl border border-arcade-line p-3">
            <p className={`ui-title text-base ${TONE[check.status]}`}>
              {check.status.toUpperCase()} · {check.label}
            </p>
            <p className="ui-body-tight mt-1 break-words text-[14px] text-arcade-muted">
              {check.detail}
            </p>
          </div>
        ))}
      </div>

      <h3 className="sticker-sm mt-6 text-[13px] tracking-[0.16em] text-arcade-text/90">
        FEATURE FLAGS
      </h3>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
        {Object.entries(GAME_FEATURES).map(([key, value]) => (
          <p key={key} className="ui-body-tight truncate text-[13px] text-arcade-muted">
            <span className={value ? "text-neon-green" : "text-arcade-muted"}>
              {value ? "on " : "off"}
            </span>{" "}
            {key}
          </p>
        ))}
      </div>

      <h3 className="sticker-sm mt-6 text-[13px] tracking-[0.16em] text-arcade-text/90">ACTIONS</h3>
      <div className="mt-2 grid gap-2">
        <button
          type="button"
          onClick={() => setLog(formatReleaseReport(validateRelease()))}
          className="arcade-btn ui-title min-h-11 w-full border border-arcade-line bg-arcade-surface py-2 text-[15px] text-arcade-text"
        >
          Run release validation
        </button>
        <button
          type="button"
          onClick={onResetOnboarding}
          className="arcade-btn ui-title min-h-11 w-full border border-arcade-line bg-arcade-surface py-2 text-[15px] text-arcade-text"
        >
          Reset onboarding &amp; tutorial flags
        </button>
        <button
          type="button"
          onClick={() => setLog(JSON.stringify(recentAnalyticsEvents().slice(-15), null, 2))}
          className="arcade-btn ui-title min-h-11 w-full border border-arcade-line bg-arcade-surface py-2 text-[15px] text-arcade-text"
        >
          Show recent analytics events
        </button>
        {IS_DEV && (
          <button
            type="button"
            onClick={onThrowTestError}
            className="arcade-btn ui-title min-h-11 w-full border border-neon-red/60 bg-arcade-surface py-2 text-[15px] text-neon-red"
          >
            Trigger error boundary
          </button>
        )}
      </div>

      {log && (
        <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap text-[12px] leading-relaxed text-arcade-text/80">
          {log}
        </pre>
      )}
    </Sheet>
  );
}
