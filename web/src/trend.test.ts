import { describe, expect, test } from 'bun:test';
import { trendDelta } from './trend';

describe('trendDelta', () => {
  test('returns the first-to-last percentage-point change going up', () => {
    expect(trendDelta([50, 55, 58])).toEqual({ delta: 8, direction: 'up' });
  });

  test('returns a negative delta going down', () => {
    expect(trendDelta([80, 60])).toEqual({ delta: -20, direction: 'down' });
  });

  test('returns flat for an unchanged series', () => {
    expect(trendDelta([30, 30, 30])).toEqual({ delta: 0, direction: 'flat' });
  });

  test('returns flat for an empty series', () => {
    expect(trendDelta([])).toEqual({ delta: 0, direction: 'flat' });
  });
});
