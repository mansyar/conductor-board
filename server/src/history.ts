import type { Board, ColumnId } from './board';

/** Aggregate snapshot shape persisted per observed board state. */
export interface BoardSummary {
  done: number;
  total: number;
  specPlan: number;
  implement: number;
  review: number;
  complete: number;
}

const ZERO_COUNTS: Record<ColumnId, number> = {
  'spec-plan': 0,
  implement: 0,
  review: 0,
  complete: 0,
};

/**
 * Reduces a loaded board to the fields a snapshot records: aggregate progress
 * plus the number of cards per lifecycle column. Idle-lane entries are not
 * counted.
 */
export function summarizeBoard(board: Board): BoardSummary {
  const counts: Record<ColumnId, number> = { ...ZERO_COUNTS };
  for (const card of board.cards) {
    if (card.columnId !== null) {
      counts[card.columnId] += 1;
    }
  }
  return {
    done: board.progress.done,
    total: board.progress.total,
    specPlan: counts['spec-plan'],
    implement: counts.implement,
    review: counts.review,
    complete: counts.complete,
  };
}

const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;

/**
 * Deterministic fingerprint (FNV-1a 32-bit, hex) of a board summary, used to
 * avoid recording duplicate snapshots for an unchanged state.
 */
export function computeStateHash(summary: BoardSummary): string {
  const canonical = [
    summary.done,
    summary.total,
    summary.specPlan,
    summary.implement,
    summary.review,
    summary.complete,
  ].join('|');
  let hash = FNV_OFFSET;
  for (let i = 0; i < canonical.length; i += 1) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Whether a new snapshot should be recorded: always for a first snapshot
 * (null previous hash), otherwise only when the state hash changed.
 */
export function shouldRecordSnapshot(
  previousHash: string | null,
  newHash: string,
): boolean {
  return previousHash === null || previousHash !== newHash;
}
