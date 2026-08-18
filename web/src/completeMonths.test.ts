import { describe, expect, test } from 'bun:test';
import {
  allMonthsExpanded,
  groupCardsByMonth,
  monthBucketKey,
  monthBucketLabel,
  nextExpansionSet,
  UNSORTED_KEY,
} from './completeMonths';
import type { TrackCard } from './types';

function card(lastModifiedMs: number | null, trackId: string): TrackCard {
  return {
    worktreePath: '/w',
    branch: 'main',
    detached: false,
    headSha: null,
    trackId,
    trackName: trackId,
    columnId: 'complete',
    progress: { done: 1, total: 1, pct: 100 },
    lastModifiedMs,
    archived: true,
  };
}

describe('monthBucketKey', () => {
  test('formats an epoch-ms as YYYY-MM', () => {
    expect(monthBucketKey(new Date(2026, 7, 17).getTime())).toBe('2026-08');
  });

  test('returns the unsorted key for null', () => {
    expect(monthBucketKey(null)).toBe(UNSORTED_KEY);
  });
});

describe('monthBucketLabel', () => {
  test('formats a YYYY-MM key as Month YYYY', () => {
    expect(monthBucketLabel('2026-08')).toBe('August 2026');
  });

  test('labels the unsorted key', () => {
    expect(monthBucketLabel(UNSORTED_KEY)).toBe('Unsorted');
  });
});

describe('allMonthsExpanded', () => {
  test('returns true only when every month key is expanded', () => {
    const keys = ['2026-08', '2026-07', UNSORTED_KEY];
    expect(
      allMonthsExpanded(keys, new Set(['2026-08', '2026-07', UNSORTED_KEY])),
    ).toBe(true);
    expect(allMonthsExpanded(keys, new Set(['2026-08', '2026-07']))).toBe(
      false,
    );
    expect(allMonthsExpanded(keys, new Set())).toBe(false);
  });

  test('returns false for an empty key list', () => {
    expect(allMonthsExpanded([], new Set())).toBe(false);
  });
});

describe('nextExpansionSet', () => {
  test('expands every month when not all are expanded', () => {
    const keys = ['2026-08', '2026-07', UNSORTED_KEY];
    const next = nextExpansionSet(keys, new Set(['2026-08']));
    expect([...next].sort()).toEqual(
      ['2026-08', '2026-07', UNSORTED_KEY].sort(),
    );
  });

  test('collapses every month when all are expanded, preserving others', () => {
    const keys = ['2026-08', '2026-07'];
    const next = nextExpansionSet(
      keys,
      new Set(['2026-08', '2026-07', '2026-06']),
    );
    expect([...next]).toEqual(['2026-06']);
  });
});

describe('groupCardsByMonth', () => {
  test('buckets cards by month, newest first, unsorted last', () => {
    const august = new Date(2026, 7, 1).getTime();
    const september = new Date(2026, 8, 1).getTime();
    const cards: TrackCard[] = [
      card(august, 'a'),
      card(september, 'b'),
      card(null, 'c'),
      card(august, 'd'),
    ];

    const groups = groupCardsByMonth(cards);

    expect(groups.map((group) => group.key)).toEqual([
      '2026-09',
      '2026-08',
      UNSORTED_KEY,
    ]);
    expect(groups.map((group) => group.label)).toEqual([
      'September 2026',
      'August 2026',
      'Unsorted',
    ]);
    expect(groups[0].cards.map((c) => c.trackId)).toEqual(['b']);
    expect(groups[1].cards.map((c) => c.trackId)).toEqual(['a', 'd']);
    expect(groups[2].cards.map((c) => c.trackId)).toEqual(['c']);
  });
});
