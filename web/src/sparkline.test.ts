import { describe, expect, test } from 'bun:test';
import { sparklineCoords, sparklinePoints } from './sparkline';

describe('sparklineCoords', () => {
  test('returns an empty array for an empty series', () => {
    expect(sparklineCoords([], 100, 30)).toEqual([]);
  });

  test('maps values to x/y coordinates within the given dimensions', () => {
    expect(sparklineCoords([0, 100], 100, 30)).toEqual([
      { x: 0, y: 30 },
      { x: 100, y: 0 },
    ]);
  });

  test('centers a flat series vertically', () => {
    expect(sparklineCoords([50, 50, 50], 60, 30)).toEqual([
      { x: 0, y: 15 },
      { x: 30, y: 15 },
      { x: 60, y: 15 },
    ]);
  });

  test('handles a single value at the left edge', () => {
    expect(sparklineCoords([42], 100, 30)).toEqual([{ x: 0, y: 15 }]);
  });
});

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
