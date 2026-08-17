import { describe, expect, test } from 'bun:test';
import { sparklinePoints } from './sparkline';

describe('sparklinePoints', () => {
  test('returns an empty string for an empty series', () => {
    expect(sparklinePoints([], 100, 30)).toBe('');
  });

  test('maps values to x/y coordinates within the given dimensions', () => {
    expect(sparklinePoints([0, 100], 100, 30)).toBe('0,30 100,0');
  });

  test('centers a flat series vertically', () => {
    expect(sparklinePoints([50, 50, 50], 60, 30)).toBe('0,15 30,15 60,15');
  });

  test('handles a single value at the left edge', () => {
    expect(sparklinePoints([42], 100, 30)).toBe('0,15');
  });
});
