/**
 * Release-readiness validation.
 *
 * Reports missing App Store requirements without ever blocking local
 * development and without transmitting anything anywhere.
 */

import {
  APP_BUILD,
  APP_ICON_PRESENT,
  APP_STORE_URL,
  APP_VERSION,
  IS_DEV,
  LAUNCH_ASSET_VERIFIED,
  NATIVE_SERVER_URL,
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_URL,
  SUGGESTED_BUNDLE_ID,
  SUPPORT_EMAIL,
  SUPPORT_URL,
} from "./appConfig";
import { isValidHttpsUrl, isValidSupportEmail } from "./urlSafety";

export type CheckLevel = "critical" | "warning" | "info";
export type CheckStatus = "pass" | "fail";

export interface ReleaseCheck {
  id: string;
  label: string;
  level: CheckLevel;
  status: CheckStatus;
  detail: string;
}

export interface ReleaseReport {
  checks: ReleaseCheck[];
  criticalFailures: number;
  warnings: number;
  ready: boolean;
}

function check(
  id: string,
  label: string,
  level: CheckLevel,
  ok: boolean,
  detail: string,
): ReleaseCheck {
  return { id, label, level, status: ok ? "pass" : "fail", detail };
}

const SEMVER = /^\d+\.\d+\.\d+$/;

export interface ReleaseInputs {
  bundleId?: string;
  /** Set true once the 1024×1024 master icon has been added. */
  appIconPresent?: boolean;
  /** Set true once the launch screen has been verified in Xcode. */
  launchAssetPresent?: boolean;
  /** Any server URL configured for the native container. Must be empty. */
  nativeServerUrl?: string;
}

export function validateRelease(inputs: ReleaseInputs = {}): ReleaseReport {
  const bundleId = inputs.bundleId ?? SUGGESTED_BUNDLE_ID;
  const appIconPresent = inputs.appIconPresent ?? APP_ICON_PRESENT;
  const launchAssetPresent = inputs.launchAssetPresent ?? LAUNCH_ASSET_VERIFIED;
  const nativeServerUrl = inputs.nativeServerUrl ?? NATIVE_SERVER_URL;

  const checks: ReleaseCheck[] = [
    check(
      "support-email",
      "Support email configured",
      "critical",
      isValidSupportEmail(SUPPORT_EMAIL),
      "Set VITE_SUPPORT_EMAIL to a real, monitored inbox.",
    ),
    check(
      "support-url",
      "Support URL configured",
      "critical",
      isValidHttpsUrl(SUPPORT_URL),
      "Set VITE_SUPPORT_URL to a public HTTPS support page.",
    ),
    check(
      "privacy-url",
      "Privacy policy URL configured",
      "critical",
      isValidHttpsUrl(PRIVACY_URL),
      "Set VITE_PRIVACY_URL to the published HTTPS privacy policy.",
    ),
    check(
      "privacy-date",
      "Privacy effective date set",
      "critical",
      PRIVACY_EFFECTIVE_DATE.length > 0,
      "Set VITE_PRIVACY_EFFECTIVE_DATE before submission.",
    ),
    check(
      "bundle-id",
      "Bundle identifier confirmed",
      "critical",
      bundleId.length > 0 && !bundleId.includes("example") && bundleId !== "com.example.app",
      `Confirm "${bundleId}" is registered in your Apple Developer account.`,
    ),
    check(
      "app-icon",
      "1024×1024 app icon added",
      "critical",
      inputs.appIconPresent === true,
      "Add the master icon per docs/app-icon-spec.md, then set appIconPresent.",
    ),
    check(
      "launch-asset",
      "Launch screen verified",
      "critical",
      inputs.launchAssetPresent === true,
      "Verify the launch screen per docs/launch-screen-spec.md.",
    ),
    check(
      "no-dev-server",
      "No development server URL in native config",
      "critical",
      !inputs.nativeServerUrl,
      "capacitor.config.ts must not define server.url for production builds.",
    ),
    check(
      "version",
      "Marketing version valid",
      "critical",
      SEMVER.test(APP_VERSION),
      `Expected semver, found "${APP_VERSION}".`,
    ),
    check(
      "build",
      "Build number valid",
      "critical",
      /^\d+$/.test(APP_BUILD) && Number(APP_BUILD) > 0,
      `Expected a positive integer, found "${APP_BUILD}".`,
    ),
    check(
      "store-url",
      "App Store URL",
      "info",
      isValidHttpsUrl(APP_STORE_URL),
      "Optional until the listing exists. Share text omits the link while empty.",
    ),
    check(
      "dev-mode",
      "Production build mode",
      "warning",
      !IS_DEV,
      "This report was generated from a development build.",
    ),
  ];

  const criticalFailures = checks.filter(
    (c) => c.level === "critical" && c.status === "fail",
  ).length;
  const warnings = checks.filter((c) => c.level === "warning" && c.status === "fail").length;

  return { checks, criticalFailures, warnings, ready: criticalFailures === 0 };
}

export function formatReleaseReport(report: ReleaseReport): string {
  const lines = report.checks.map((c) => {
    const mark = c.status === "pass" ? "PASS" : c.level === "critical" ? "FAIL" : "WARN";
    return `[${mark}] ${c.label}${c.status === "pass" ? "" : ` — ${c.detail}`}`;
  });
  lines.push(
    "",
    report.ready
      ? "Release readiness: OK (no critical items outstanding)."
      : `Release readiness: ${report.criticalFailures} critical item(s) outstanding.`,
  );
  return lines.join("\n");
}
