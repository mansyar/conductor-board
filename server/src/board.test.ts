import { describe, expect, test } from 'bun:test';
import type { Progress, TrackSource } from './board';
import { composeBoard, countPlanProgress } from './board';
import type { TrackEntry } from './registry';
import type { WorktreeInfo } from './worktrees';

function entry(overrides: Partial<TrackEntry> = {}): TrackEntry {
  return {
    state: ' ',
    id: 'track-a',
    description: 'Track A',
    link: './tracks/track-a/index.md',
    ...overrides,
  };
}

function worktree(
  path: string,
  overrides: Partial<WorktreeInfo> = {},
): WorktreeInfo {
  return { path, branch: 'main', detached: false, ...overrides };
}

function source(
  track: TrackEntry,
  progress: Progress,
  archived = false,
  wt: WorktreeInfo = worktree('/worktrees/main'),
): TrackSource {
  return { worktree: wt, entry: track, archived, progress };
}

describe('countPlanProgress', () => {
  test('counts dispatched and total top-level task lines', () => {
    const plan = `# Plan

- [x] Task: One
- [~] Task: Two
- [ ] Task: Three
  - [x] sub task not counted

- [x] Task: Four
`;
    expect(countPlanProgress(plan)).toEqual({ done: 2, total: 4, pct: 50 });
  });

  test('returns zero progress for an empty plan', () => {
    expect(countPlanProgress('')).toEqual({ done: 0, total: 0, pct: 0 });
  });

  test('returns 100% when all tasks are done', () => {
    expect(countPlanProgress('- [x] Task: A\n- [x] Task: B\n')).toEqual({
      done: 2,
      total: 2,
      pct: 100,
    });
  });
});

describe('composeBoard', () => {
  test('emits one card per track in the correct column', () => {
    const board = composeBoard([
      {
        worktree: worktree('/w'),
        tracks: [source(entry({ state: ' ' }), { done: 1, total: 4, pct: 25 })],
      },
    ]);
    expect(board.cards).toHaveLength(1);
    expect(board.cards[0].columnId).toBe('spec-plan');
    expect(board.cards[0].trackId).toBe('track-a');
    expect(board.cards[0].worktreePath).toBe('/w');
    expect(board.idle).toHaveLength(0);
  });

  test('places multiple tracks from one worktree into their columns', () => {
    const board = composeBoard([
      {
        worktree: worktree('/w'),
        tracks: [
          source(entry({ id: 't1', state: ' ' }), {
            done: 0,
            total: 3,
            pct: 0,
          }),
          source(entry({ id: 't2', state: '~' }), {
            done: 2,
            total: 3,
            pct: 67,
          }),
          source(entry({ id: 't3', state: 'x' }), {
            done: 3,
            total: 3,
            pct: 100,
          }),
        ],
      },
    ]);
    expect(board.cards).toHaveLength(3);
    expect(board.cards.map((c) => c.columnId)).toEqual([
      'spec-plan',
      'implement',
      'review',
    ]);
    expect(board.idle).toHaveLength(0);
  });

  test('sends a worktree with no tracks to the idle lane', () => {
    const board = composeBoard([
      {
        worktree: worktree('/w-idle', { branch: null, detached: true }),
        tracks: [],
      },
      {
        worktree: worktree('/w-active'),
        tracks: [source(entry({ state: '~' }), { done: 1, total: 2, pct: 50 })],
      },
    ]);
    expect(board.idle).toHaveLength(1);
    expect(board.idle[0].worktreePath).toBe('/w-idle');
    expect(board.idle[0].trackId).toBeNull();
    expect(board.idle[0].columnId).toBeNull();
    expect(board.cards).toHaveLength(1);
  });

  test('aggregates progress across all cards', () => {
    const board = composeBoard([
      {
        worktree: worktree('/w'),
        tracks: [
          source(entry({ id: 't1' }), { done: 2, total: 4, pct: 50 }),
          source(entry({ id: 't2' }), { done: 4, total: 4, pct: 100 }),
        ],
      },
    ]);
    expect(board.progress).toEqual({ done: 6, total: 8, pct: 75 });
  });

  test('classifies an archived track as Complete', () => {
    const board = composeBoard([
      {
        worktree: worktree('/w'),
        tracks: [
          source(entry({ state: 'x' }), { done: 4, total: 4, pct: 100 }, true),
        ],
      },
    ]);
    expect(board.cards[0].columnId).toBe('complete');
  });

  test('exposes the four lifecycle columns in order', () => {
    const board = composeBoard([]);
    expect(board.columns).toEqual([
      'spec-plan',
      'implement',
      'review',
      'complete',
    ]);
  });
});
