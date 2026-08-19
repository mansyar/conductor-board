import { COLUMN_ORDER } from './boardColumns';
import type { TrackCard } from './types';

export type ColumnTotals = Record<(typeof COLUMN_ORDER)[number], number>;

/** Counts cards per lifecycle column; cards with null/unknown ids are ignored. */
export function columnTotals(cards: TrackCard[]): ColumnTotals {
  const totals = Object.fromEntries(
    COLUMN_ORDER.map((id) => [id, 0]),
  ) as ColumnTotals;
  for (const card of cards) {
    if (card.columnId !== null && card.columnId in totals) {
      totals[card.columnId] += 1;
    }
  }
  return totals;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/**
 * Formats an ISO timestamp as a short month-day label (e.g. `Aug 17`), parsed
 * in UTC so the label is stable regardless of the viewer's timezone. Falls back
 * to the raw value when the input is not a valid date.
 */
export function formatSnapshotDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}`;
}
