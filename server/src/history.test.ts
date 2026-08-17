import { describe, expect, test } from 'bun:test';
import { composeBoard, type TrackSource } from './board';
import {
  type BoardSummary,
  computeStateHash,
  shouldRecordSnapshot,
  summarizeBoard,
} from './history';
import type { TrackEntry } from './registry';
import type { WorktreeInfo } from './worktrees';

function entry(state: TrackEntry['state'], id: string): TrackEntry {
  return {
    state,
    id,
    description: `Track ${id}`,
    link: `./tracks/${id}/index.md`,
  };
}

function worktree(): WorktreeInfo {
  return { path: '/w', branch: 'main', detached: false, headSha: null };
}

function active(state: TrackEntry['state'], id: string): TrackSource {
  return {
    worktree: worktree(),
    entry: entry(state, id),
    archived: false,
    progress: { done: 1, total: 2, pct: 50 },
    lastModifiedMs: null,
  };
}

function archived(id: string): TrackSource {
  return {
    worktree: worktree(),
    entry: entry('x', id),
    archived: true,
    progress: { done: 2, total: 2, pct: 100 },
    lastModifiedMs: null,
  };
}

describe('summarizeBoard', () => {
  test('reduces a board to progress and per-column counts, excluding idle', () => {
    const board = composeBoard([
      {
        worktree: worktree(),
        tracks: [
          active(' ', 'a'),
          active(' ', 'b'),
          active('~', 'c'),
          active('x', 'd'),
          archived('e'),
        ],
      },
      { worktree: worktree(), tracks: [] },
    ]);

    expect(summarizeBoard(board)).toEqual({
      done: 6,
      total: 10,
      specPlan: 2,
      implement: 1,
      review: 1,
      complete: 1,
    });
  });

  test('returns zeros for an empty board', () => {
    expect(summarizeBoard(composeBoard([]))).toEqual({
      done: 0,
      total: 0,
      specPlan: 0,
      implement: 0,
      review: 0,
      complete: 0,
    });
  });
});

describe('computeStateHash', () => {
  const summary: BoardSummary = {
    done: 1,
    total: 2,
    specPlan: 1,
    implement: 0,
    review: 0,
    complete: 0,
  };

  test('is deterministic for the same summary', () => {
    expect(computeStateHash(summary)).toBe(computeStateHash({ ...summary }));
  });

  test('differs when any field changes', () => {
    const base = computeStateHash(summary);
    expect(computeStateHash({ ...summary, done: 2 })).not.toBe(base);
    expect(computeStateHash({ ...summary, total: 3 })).not.toBe(base);
    expect(computeStateHash({ ...summary, specPlan: 2 })).not.toBe(base);
    expect(computeStateHash({ ...summary, implement: 1 })).not.toBe(base);
    expect(computeStateHash({ ...summary, review: 1 })).not.toBe(base);
    expect(computeStateHash({ ...summary, complete: 1 })).not.toBe(base);
  });
});

describe('shouldRecordSnapshot', () => {
  test('records when there is no previous hash', () => {
    expect(shouldRecordSnapshot(null, 'abc')).toBe(true);
  });

  test('records when the hash differs', () => {
    expect(shouldRecordSnapshot('old', 'new')).toBe(true);
  });

  test('does not record when the hash is unchanged', () => {
    expect(shouldRecordSnapshot('same', 'same')).toBe(false);
  });
});
