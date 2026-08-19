import { describe, expect, test } from 'bun:test';
import { columnTotals, formatSnapshotDate } from './boardHeader';
import type { TrackCard } from './types';

function card(columnId: TrackCard['columnId'], trackId: string): TrackCard {
  return {
    worktreePath: '/w',
    branch: 'main',
    detached: false,
    headSha: null,
    trackId,
    trackName: trackId,
    columnId,
    progress: { done: 1, total: 1, pct: 100 },
    lastModifiedMs: null,
    archived: true,
  };
}

describe('columnTotals', () => {
  test('counts cards per lifecycle column', () => {
    const cards: TrackCard[] = [
      card('spec-plan', 'a'),
      card('implement', 'b'),
      card('implement', 'c'),
      card('review', 'd'),
      card('complete', 'e'),
      card('complete', 'f'),
      card('complete', 'g'),
    ];

    expect(columnTotals(cards)).toEqual({
      'spec-plan': 1,
      implement: 2,
      review: 1,
      complete: 3,
    });
  });

  test('returns zeros when no cards match a column', () => {
    expect(columnTotals([])).toEqual({
      'spec-plan': 0,
      implement: 0,
      review: 0,
      complete: 0,
    });
  });

  test('ignores cards with null or unknown column ids', () => {
    const cards: TrackCard[] = [
      card('spec-plan', 'a'),
      card(null, 'b'),
    ];

    expect(columnTotals(cards)).toEqual({
      'spec-plan': 1,
      implement: 0,
      review: 0,
      complete: 0,
    });
  });
});

describe('formatSnapshotDate', () => {
  test('formats an ISO timestamp as a short month-day label', () => {
    expect(formatSnapshotDate('2026-08-17T00:01:00.000Z')).toBe('Aug 17');
    expect(formatSnapshotDate('2026-01-05T23:59:00.000Z')).toBe('Jan 5');
  });

  test('falls back to the raw value when unparseable', () => {
    expect(formatSnapshotDate('not-a-date')).toBe('not-a-date');
    expect(formatSnapshotDate('')).toBe('');
  });
});
