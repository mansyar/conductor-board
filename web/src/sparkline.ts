function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Maps a numeric series to an SVG polyline `points` string within the given
 * width/height. Values are normalized against their min/max; a flat series is
 * centered vertically, an empty series yields an empty string, and a single
 * value is placed at the left edge.
 */
export function sparklinePoints(
  values: number[],
  width: number,
  height: number,
): string {
  if (values.length === 0) {
    return '';
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  return values
    .map((value, index) => {
      const x =
        values.length === 1 ? 0 : round2((index / (values.length - 1)) * width);
      const normalized = range === 0 ? 0.5 : (value - min) / range;
      const y = round2(height - normalized * height);
      return `${x},${y}`;
    })
    .join(' ');
}
