import type { CSSProperties } from "react";
import { describeSeries } from "@/game/statsTrends";

interface SparklineProps {
  label: string;
  values: number[];
  unit?: string;
  tone?: "green" | "gold" | "purple";
  /** lower values are better (reaction time) */
  invert?: boolean;
}

const TONE: Record<NonNullable<SparklineProps["tone"]>, string> = {
  green: "var(--color-logo-green, #39ff88)",
  gold: "var(--color-neon-gold, #ffd23f)",
  purple: "var(--color-neon-purple, #b06cff)",
};

/**
 * Dependency-free trend chart. Bars keep the arcade look, stay readable at
 * small sizes and expose a plain-language label to screen readers.
 */
export function Sparkline({
  label,
  values,
  unit = "",
  tone = "green",
  invert = false,
}: SparklineProps) {
  if (values.length === 0) {
    return (
      <p className="ui-body text-[14px] text-arcade-muted">
        {label}: not enough runs yet.
      </p>
    );
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(1, max - min);
  const color = TONE[tone];

  return (
    <figure aria-label={describeSeries(label, values, unit)}>
      <figcaption className="ui-title text-[10px] tracking-[0.22em] text-arcade-muted">
        {label.toUpperCase()}
      </figcaption>
      <div className="mt-2 flex h-16 items-end gap-[3px]" role="img" aria-hidden>
        {values.map((value, index) => {
          const ratio = (value - min) / span;
          const height = Math.max(6, Math.round((invert ? 1 - ratio : ratio) * 100));
          const style: CSSProperties = {
            height: `${height}%`,
            background: color,
            opacity: index === values.length - 1 ? 1 : 0.55,
          };
          return (
            <span
              key={index}
              className="min-w-[4px] flex-1 rounded-t-[2px]"
              style={style}
            />
          );
        })}
      </div>
      <p className="ui-body mt-1.5 text-[13px] text-arcade-muted tabular-nums">
        latest {Math.round(values[values.length - 1])}
        {unit} · best {Math.round(invert ? Math.min(...values) : Math.max(...values))}
        {unit}
      </p>
    </figure>
  );
}
