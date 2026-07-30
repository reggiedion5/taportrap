export function formatPlayTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m ${totalSeconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function formatMsValue(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value <= 0) return "—";
  return `${Math.round(value)}ms`;
}

export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return String(Math.max(0, Math.round(value)));
}

export function formatAverage(total: number, samples: number): string {
  if (!samples || !Number.isFinite(total) || !Number.isFinite(samples)) return "—";
  return `${Math.round(total / samples)}ms`;
}

export function formatSeconds(ms: number): string {
  const secs = Math.max(0, ms) / 1000;
  return secs.toFixed(1);
}
