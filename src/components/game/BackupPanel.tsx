import { useRef, useState } from "react";
import { APP_VERSION } from "@/lib/appConfig";
import {
  applyImport,
  exportProgressText,
  resetLocalProgress,
  validateImport,
  type BackupDocument,
  type ImportSummary,
} from "@/game/backup";

interface BackupPanelProps {
  /** Called after progress on disk changed so the app can re-read it. */
  onImported: () => void;
}

type Status = { tone: "ok" | "error"; text: string } | null;

/**
 * Export / import / reset for the local player profile. Every destructive step
 * needs an explicit second confirmation, and imports are validated and
 * summarised before anything is written.
 */
export function BackupPanel({ onImported }: BackupPanelProps) {
  const [exported, setExported] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [pending, setPending] = useState<{ doc: BackupDocument; summary: ImportSummary } | null>(
    null,
  );
  const [status, setStatus] = useState<Status>(null);
  const [resetStep, setResetStep] = useState(0);
  const [resetConfirm, setResetConfirm] = useState("");
  const [keepSettings, setKeepSettings] = useState(true);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const doExport = () => {
    const text = exportProgressText(APP_VERSION);
    setExported(text);
    setStatus({ tone: "ok", text: "Backup created. Copy or download it below." });
  };

  const copyExport = async () => {
    if (!exported) return;
    try {
      await navigator.clipboard.writeText(exported);
      setStatus({ tone: "ok", text: "Backup copied to the clipboard." });
    } catch {
      setStatus({ tone: "error", text: "Copy unavailable — select the text manually." });
    }
  };

  const downloadExport = () => {
    if (!exported || typeof window === "undefined") return;
    try {
      const blob = new Blob([exported], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tap-or-trap-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setStatus({ tone: "error", text: "Download unavailable on this device — copy instead." });
    }
  };

  const check = (text: string) => {
    const result = validateImport(text);
    if (!result.ok) {
      setPending(null);
      setStatus({ tone: "error", text: result.error });
      return;
    }
    setPending({ doc: result.document, summary: result.summary });
    setStatus(null);
  };

  const confirmImport = () => {
    if (!pending) return;
    const applied = applyImport(pending.doc);
    if (!applied.ok) {
      setStatus({ tone: "error", text: applied.error ?? "Import failed." });
      return;
    }
    setPending(null);
    setImportText("");
    setStatus({ tone: "ok", text: "Progress imported." });
    onImported();
  };

  const doReset = () => {
    resetLocalProgress(keepSettings);
    setResetStep(0);
    setResetConfirm("");
    setStatus({ tone: "ok", text: "Local progress deleted." });
    onImported();
  };

  return (
    <div className="grid gap-6">
      <section>
        <h4 className="sticker-sm text-[13px] tracking-[0.16em] text-arcade-text/90">
          EXPORT PROGRESS
        </h4>
        <p className="ui-prose mt-2 text-[15px] text-arcade-muted">
          Creates a JSON snapshot of your levels, records, unlocks and settings. It contains no
          account details and no device identifiers.
        </p>
        <button
          type="button"
          onClick={doExport}
          className="arcade-btn ui-title mt-3 min-h-12 w-full border border-arcade-line bg-arcade-surface py-3 text-base text-arcade-text"
        >
          Create backup
        </button>
        {exported && (
          <>
            <textarea
              readOnly
              value={exported}
              aria-label="Progress backup JSON"
              className="ui-body mt-3 h-32 w-full rounded-xl border border-arcade-line bg-arcade-bg-deep p-3 text-[13px] text-arcade-text"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={copyExport}
                className="arcade-btn ui-title min-h-11 border border-arcade-line bg-arcade-surface py-2 text-[15px] text-arcade-text"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={downloadExport}
                className="arcade-btn ui-title min-h-11 border border-arcade-line bg-arcade-surface py-2 text-[15px] text-arcade-text"
              >
                Download
              </button>
            </div>
          </>
        )}
      </section>

      <section>
        <h4 className="sticker-sm text-[13px] tracking-[0.16em] text-arcade-text/90">
          IMPORT PROGRESS
        </h4>
        <p className="ui-prose mt-2 text-[15px] text-arcade-muted">
          Paste or load a backup. It is checked and summarised before anything is replaced.
        </p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste backup JSON here"
          aria-label="Backup JSON to import"
          className="ui-body mt-3 h-28 w-full rounded-xl border border-arcade-line bg-arcade-bg-deep p-3 text-[13px] text-arcade-text placeholder:text-arcade-muted"
        />
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const text = await file.text();
            setImportText(text);
            check(text);
          }}
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="arcade-btn ui-title min-h-11 border border-arcade-line bg-arcade-surface py-2 text-[15px] text-arcade-text"
          >
            Choose file
          </button>
          <button
            type="button"
            onClick={() => check(importText)}
            disabled={importText.trim().length === 0}
            className="arcade-btn ui-title min-h-11 border border-arcade-line bg-arcade-surface py-2 text-[15px] text-arcade-text disabled:opacity-50"
          >
            Check backup
          </button>
        </div>

        {pending && (
          <div className="mt-3 rounded-xl border border-neon-gold/60 bg-neon-gold/10 p-4">
            <p className="ui-title text-base text-neon-gold">Replace current progress?</p>
            <ul className="ui-body-tight mt-2 grid gap-1 text-[14px] text-arcade-text/95">
              <li>Level {pending.summary.level}</li>
              <li>{pending.summary.lifetimeXp} lifetime XP</li>
              <li>{pending.summary.gamesPlayed} games played</li>
              <li>{pending.summary.achievementsUnlocked} achievements</li>
              <li>Created {pending.summary.generatedAt}</li>
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="arcade-btn ui-title min-h-11 border border-arcade-line bg-arcade-surface py-2 text-[15px] text-arcade-text"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmImport}
                className="arcade-btn ui-title min-h-11 bg-neon-green py-2 text-[15px] text-arcade-bg-deep"
              >
                Import
              </button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h4 className="sticker-sm text-[13px] tracking-[0.16em] text-neon-red">RESET PROGRESS</h4>
        <p className="ui-prose mt-2 text-[15px] text-arcade-muted">
          Deletes levels, XP, records, statistics, unlocks, missions and challenges from this
          device. This cannot be undone.
        </p>
        <label className="ui-body mt-3 flex items-center gap-3 text-[15px] text-arcade-text">
          <input
            type="checkbox"
            checked={keepSettings}
            onChange={(e) => setKeepSettings(e.target.checked)}
            className="size-5"
          />
          Keep my settings
        </label>
        {resetStep === 0 ? (
          <button
            type="button"
            onClick={() => setResetStep(1)}
            className="arcade-btn ui-title mt-3 min-h-12 w-full border border-neon-red/60 bg-arcade-surface py-3 text-base text-neon-red"
          >
            Reset progress…
          </button>
        ) : (
          <div className="mt-3 grid gap-2">
            <label className="ui-body text-[15px] text-arcade-text" htmlFor="reset-confirm">
              Type DELETE to confirm
            </label>
            <input
              id="reset-confirm"
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              className="ui-body w-full rounded-xl border border-neon-red/60 bg-arcade-bg-deep p-3 text-[15px] text-arcade-text"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setResetStep(0);
                  setResetConfirm("");
                }}
                className="arcade-btn ui-title min-h-11 border border-arcade-line bg-arcade-surface py-2 text-[15px] text-arcade-text"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetConfirm.trim().toUpperCase() !== "DELETE"}
                onClick={doReset}
                className="arcade-btn ui-title min-h-11 bg-neon-red py-2 text-[15px] text-arcade-text disabled:opacity-50"
              >
                Delete data
              </button>
            </div>
          </div>
        )}
      </section>

      {status && (
        <p
          aria-live="polite"
          className={`ui-body text-[15px] ${status.tone === "ok" ? "text-neon-green" : "text-neon-red"}`}
        >
          {status.text}
        </p>
      )}
    </div>
  );
}
