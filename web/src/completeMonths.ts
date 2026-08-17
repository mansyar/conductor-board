import type { TrackCard } from './types';

export const UNSORTED_KEY = 'unsorted';

export interface MonthGroup {
  key: string;
  label: string;
  cards: TrackCard[];
}

/** Stable month bucket key (YYYY-MM), or `unsorted` when no timestamp exists. */
export function monthBucketKey(lastModifiedMs: number | null): string {
  if (lastModifiedMs === null) {
    return UNSORTED_KEY;
  }
  const date = new Date(lastModifiedMs);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Human label for a month bucket key, or `Unsorted` for the unsorted bucket. */
export function monthBucketLabel(key: string): string {
  if (key === UNSORTED_KEY) {
    return 'Unsorted';
  }
  const [year, month] = key.split('-');
  const name = MONTH_NAMES[Number(month) - 1];
  return name === undefined ? key : `${name} ${year}`;
}

/** Groups cards by month, newest month first with the unsorted bucket last. */
export function groupCardsByMonth(cards: TrackCard[]): MonthGroup[] {
  const byKey = new Map<string, TrackCard[]>();
  for (const card of cards) {
    const key = monthBucketKey(card.lastModifiedMs);
    const existing = byKey.get(key);
    if (existing === undefined) {
      byKey.set(key, [card]);
    } else {
      existing.push(card);
    }
  }

  return [...byKey.entries()]
    .map(([key, groupCards]) => ({
      key,
      label: monthBucketLabel(key),
      cards: groupCards,
    }))
    .sort((a, b) => {
      if (a.key === UNSORTED_KEY) {
        return 1;
      }
      if (b.key === UNSORTED_KEY) {
        return -1;
      }
      return b.key.localeCompare(a.key);
    });
}
