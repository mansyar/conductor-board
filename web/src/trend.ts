export type TrendDirection = 'up' | 'down' | 'flat';

export interface TrendDelta {
  /** First-to-last percentage-point change. */
  delta: number;
  direction: TrendDirection;
}

/** Computes the first-to-last percentage-point change of a pct series. */
export function trendDelta(pcts: number[]): TrendDelta {
  if (pcts.length === 0) {
    return { delta: 0, direction: 'flat' };
  }
  const delta = pcts[pcts.length - 1] - pcts[0];
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  return { delta, direction };
}
