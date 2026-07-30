export interface AreaBounds {
  width: number;
  height: number;
}

export interface Placement {
  x: number;
  y: number;
  size: number;
}

const MIN_TARGET = 72;
const MAX_TARGET = 148;
const EDGE_PADDING = 10;

/** Diameter that always fits inside the measured play area. */
export function targetSizeFor(bounds: AreaBounds, scale = 1): number {
  const shortest = Math.min(bounds.width, bounds.height);
  if (!Number.isFinite(shortest) || shortest <= 0) return MIN_TARGET;
  const ideal = shortest * 0.3 * scale;
  const capped = Math.max(32, Math.min(bounds.width, bounds.height) - EDGE_PADDING * 2);
  return Math.round(Math.max(Math.min(MIN_TARGET, capped), Math.min(ideal, MAX_TARGET, capped)));
}

/**
 * Diameter for modes that ask for an explicit pixel size (Zen / Kids Assist).
 * Always shrunk to something that still fits the measured area.
 */
export function fixedTargetSize(bounds: AreaBounds, preferred: number): number {
  const shortest = Math.min(bounds.width, bounds.height);
  if (!Number.isFinite(shortest) || shortest <= 0) return MIN_TARGET;
  const capped = Math.max(32, shortest - EDGE_PADDING * 2);
  return Math.round(Math.min(Math.max(48, preferred), capped, MAX_TARGET * 1.2));
}

export interface PlacementOptions {
  /**
   * 0 = the full area is usable, 1 = dead centre only. Kids Assist uses a
   * positive bias so targets stay away from the extreme corners.
   */
  centerBias?: number;
  /** extra breathing room from the edges, on top of the standard padding */
  extraInset?: number;
}

/**
 * Pick a centre point that keeps the whole target inside the measured area,
 * away from previous position. Falls back gracefully on tiny screens.
 */
export function pickPlacement(
  bounds: AreaBounds,
  size: number,
  previous: { x: number; y: number } | null,
  options: PlacementOptions = {},
): Placement {
  const radius = size / 2 + EDGE_PADDING + Math.max(0, options.extraInset ?? 0);
  let minX = radius;
  let maxX = bounds.width - radius;
  let minY = radius;
  let maxY = bounds.height - radius;

  const bias = Math.min(0.85, Math.max(0, options.centerBias ?? 0));
  if (bias > 0 && maxX > minX && maxY > minY) {
    const cx = bounds.width / 2;
    const cy = bounds.height / 2;
    minX = cx - (cx - minX) * (1 - bias);
    maxX = cx + (maxX - cx) * (1 - bias);
    minY = cy - (cy - minY) * (1 - bias);
    maxY = cy + (maxY - cy) * (1 - bias);
  }

  if (maxX <= minX || maxY <= minY) {
    return { x: bounds.width / 2, y: bounds.height / 2, size };
  }

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  // graceful minimum travel: shrinks automatically on very small areas
  const minDistance = Math.min(size * 1.1, Math.hypot(spanX, spanY) * 0.45);

  let best = { x: minX + Math.random() * spanX, y: minY + Math.random() * spanY };
  if (!previous) return { ...best, size };

  let bestDistance = -1;
  for (let i = 0; i < 12; i++) {
    const candidate = {
      x: minX + Math.random() * spanX,
      y: minY + Math.random() * spanY,
    };
    const distance = Math.hypot(candidate.x - previous.x, candidate.y - previous.y);
    if (distance >= minDistance) return { ...candidate, size };
    if (distance > bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return { ...best, size };
}
