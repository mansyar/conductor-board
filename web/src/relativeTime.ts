const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/**
 * Formats an epoch-ms timestamp as a compact relative time: `just now` under a
 * minute, `N m ago`, `N h ago`, or `N d ago` afterwards.
 */
export function relativeTime(timestampMs: number): string {
  const elapsed = Math.max(0, Date.now() - timestampMs);
  if (elapsed < MINUTE_MS) {
    return 'just now';
  }
  if (elapsed < HOUR_MS) {
    return `${Math.floor(elapsed / MINUTE_MS)}m ago`;
  }
  if (elapsed < DAY_MS) {
    return `${Math.floor(elapsed / HOUR_MS)}h ago`;
  }
  return `${Math.floor(elapsed / DAY_MS)}d ago`;
}
