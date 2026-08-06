import { diagnosticsVisible, GAME_FEATURES } from "@/config/gameFeatures";

interface DiagnosticPanelProps {
  phase: string;
  score: number;
  combo: number;
  tierLabel: string;
  tierLevel: number;
  reaction: number | null;
  timing: string | null;
  closeCall: boolean;
  summaryExists: boolean;
}

/**
 * Development-only overlay. Renders nothing in production builds, so it can
 * never affect the native iOS bundle's runtime behaviour.
 */
export function DiagnosticPanel(props: DiagnosticPanelProps) {
  if (!diagnosticsVisible()) return null;

  const flags = Object.entries(GAME_FEATURES)
    .filter(([, on]) => on)
    .map(([key]) => key);

  return (
    <aside
      aria-hidden
      className="pointer-events-none fixed bottom-2 left-2 z-[200] max-w-[16rem] rounded-md border border-arcade-line/70 bg-arcade-bg-deep/90 p-2 font-mono text-[10px] leading-tight text-arcade-text/85"
    >
      <p>phase: {props.phase}</p>
      <p>score: {props.score}</p>
      <p>combo: {props.combo}</p>
      <p>
        tier: {props.tierLevel} · {props.tierLabel}
      </p>
      <p>reaction: {props.reaction !== null ? `${props.reaction}ms` : "—"}</p>
      <p>timing: {props.timing ?? "—"}</p>
      <p>closeCall: {props.closeCall ? "yes" : "no"}</p>
      <p>summary: {props.summaryExists ? "yes" : "no"}</p>
      <p className="mt-1 break-words opacity-70">flags: {flags.join(", ")}</p>
    </aside>
  );
}
