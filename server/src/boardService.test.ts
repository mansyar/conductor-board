import { describe, expect, test } from 'bun:test';
import type { Board } from './board';
import type { ProjectReads } from './boardService';
import { loadBoard } from './boardService';
import type { WorktreeInfo } from './worktrees';

const REGISTRY = `# Tracks Registry

- [ ] **Track: Spec Track** *Link: [tracks/spec_20260101/index.md](./tracks/spec_20260101/index.md)*
- [~] **Track: Impl Track** *Link: [tracks/impl_20260102/index.md](./tracks/impl_20260102/index.md)*
- [x] **Track: Review Track** *Link: [tracks/review_20260103/index.md](./tracks/review_20260103/index.md)*
`;

const PLAN_TWO_OF_FOUR = `# Plan

- [x] Task: One
- [x] Task: Two
- [ ] Task: Three
- [ ] Task: Four
`;

const PLAN_DONE = `- [x] Task: A
- [x] Task: B
- [x] Task: C
`;

interface FakeOptions {
  files?: Record<string, string>;
  archived?: string[];
  /** Worktree path -> archived track folder names returned by listArchiveDirs. */
  archiveDirs?: Record<string, string[]>;
}

function fakeReads(options: FakeOptions = {}): ProjectReads {
  const files = new Map(Object.entries(options.files ?? {}));
  const archived = new Set(options.archived ?? []);
  const archiveDirs = new Map(Object.entries(options.archiveDirs ?? {}));

  return {
    async listWorktrees(): Promise<WorktreeInfo[]> {
      return [
        { path: '/w/main', branch: 'main', detached: false },
        { path: '/w/feature-a', branch: 'feature-a', detached: false },
      ];
    },
    async listArchiveDirs(worktreePath: string): Promise<string[]> {
      return archiveDirs.get(worktreePath) ?? [];
    },
    async readTextFile(
      worktreePath: string,
      relativePath: string,
    ): Promise<string> {
      const key = relativePath.startsWith(worktreePath)
        ? relativePath
        : `${worktreePath}/${relativePath}`;
      const content = files.get(key);
      if (content === undefined) {
        throw new Error(`Missing file ${key}`);
      }
      return content;
    },
    async isArchived(worktreePath: string, trackId: string): Promise<boolean> {
      return archived.has(`${worktreePath}/conductor/archive/${trackId}`);
    },
  };
}

const MAIN = '/w/main';

describe('loadBoard', () => {
  test('builds cards with correct columns and progress for each track', async () => {
    const reads = fakeReads({
      files: {
        [`${MAIN}/conductor/tracks.md`]: REGISTRY,
        [`${MAIN}/conductor/tracks/spec_20260101/plan.md`]: PLAN_TWO_OF_FOUR,
        [`${MAIN}/conductor/tracks/impl_20260102/plan.md`]: PLAN_TWO_OF_FOUR,
        [`${MAIN}/conductor/tracks/review_20260103/plan.md`]: PLAN_TWO_OF_FOUR,
        '/w/feature-a/conductor/tracks.md': [
          '- [ ] **Track: Feature A** *Link: [tracks/feature_20260104/index.md](./tracks/feature_20260104/index.md)*',
        ].join('\n'),
        '/w/feature-a/conductor/tracks/feature_20260104/plan.md':
          PLAN_TWO_OF_FOUR,
      },
    });

    const board: Board = await loadBoard(reads, '/w');

    expect(board.cards).toHaveLength(4);
    const byId: Record<string, (typeof board.cards)[0]> = {};
    for (const card of board.cards) {
      if (card.trackId !== null) {
        byId[card.trackId] = card;
      }
    }
    expect(byId.spec_20260101.columnId).toBe('spec-plan');
    expect(byId.impl_20260102.columnId).toBe('implement');
    expect(byId.review_20260103.columnId).toBe('review');
    expect(byId.spec_20260101.progress).toEqual({
      done: 2,
      total: 4,
      pct: 50,
    });
    expect(board.idle).toHaveLength(0);
  });

  test('flags a worktree without conductor/ as not initialized in the idle lane', async () => {
    const reads = fakeReads({
      files: {
        '/w/feature-a/conductor/tracks.md': '',
      },
    });

    const board = await loadBoard(reads, '/w');

    const idleMain = board.idle.find((c) => c.worktreePath === MAIN);
    expect(idleMain).toBeDefined();
    expect(idleMain?.notInitialized).toBe(true);
  });

  test('places a worktree with an empty registry in the idle lane (not not-initialized)', async () => {
    const reads = fakeReads({
      files: {
        [`${MAIN}/conductor/tracks.md`]: '',
        '/w/feature-a/conductor/tracks.md': '',
      },
    });

    const board = await loadBoard(reads, '/w');

    expect(board.idle).toHaveLength(2);
    expect(board.idle.every((c) => c.notInitialized === false)).toBe(true);
  });

  test('classifies an archived track as complete', async () => {
    const reads = fakeReads({
      files: {
        [`${MAIN}/conductor/tracks.md`]: REGISTRY,
      },
      archived: [`${MAIN}/conductor/archive/review_20260103`],
    });

    const board = await loadBoard(reads, '/w');

    const review = board.cards.find((c) => c.trackId === 'review_20260103');
    expect(review?.columnId).toBe('complete');
  });

  test('aggregates progress across the whole board', async () => {
    const reads = fakeReads({
      files: {
        [`${MAIN}/conductor/tracks.md`]: REGISTRY,
        [`${MAIN}/conductor/tracks/spec_20260101/plan.md`]: PLAN_TWO_OF_FOUR,
        [`${MAIN}/conductor/tracks/impl_20260102/plan.md`]: PLAN_TWO_OF_FOUR,
        [`${MAIN}/conductor/tracks/review_20260103/plan.md`]: PLAN_TWO_OF_FOUR,
      },
    });

    const board = await loadBoard(reads, '/w');

    expect(board.progress).toEqual({ done: 6, total: 12, pct: 50 });
  });

  test('surfaces archived tracks from conductor/archive as complete cards', async () => {
    const reads = fakeReads({
      archiveDirs: { [MAIN]: ['archived-1', 'archived-2'] },
      files: {
        [`${MAIN}/conductor/archive/archived-1/metadata.json`]: JSON.stringify({
          title: 'Archived One',
        }),
        [`${MAIN}/conductor/archive/archived-1/plan.md`]: PLAN_DONE,
        [`${MAIN}/conductor/archive/archived-2/metadata.json`]: JSON.stringify({
          title: 'Archived Two',
        }),
        [`${MAIN}/conductor/archive/archived-2/plan.md`]: PLAN_DONE,
      },
    });

    const board = await loadBoard(reads, '/w');

    const a1 = board.cards.find((c) => c.trackId === 'archived-1');
    expect(a1).toBeDefined();
    expect(a1?.trackName).toBe('Archived One');
    expect(a1?.columnId).toBe('complete');
    expect(a1?.archived).toBe(true);
    expect(a1?.progress).toEqual({ done: 3, total: 3, pct: 100 });
  });

  test('dedupes archived tracks across worktrees', async () => {
    const reads = fakeReads({
      archiveDirs: { [MAIN]: ['shared'], '/w/feature-a': ['shared'] },
      files: {
        [`${MAIN}/conductor/archive/shared/metadata.json`]: JSON.stringify({
          title: 'Shared',
        }),
        [`${MAIN}/conductor/archive/shared/plan.md`]: PLAN_DONE,
      },
    });

    const board = await loadBoard(reads, '/w');

    const shared = board.cards.filter((c) => c.trackId === 'shared');
    expect(shared).toHaveLength(1);
    expect(shared[0].archived).toBe(true);
  });

  test('aggregates progress over deduped archived cards only', async () => {
    const merge = (wt: string) => ({
      [`${wt}/conductor/archive/shared/metadata.json`]: JSON.stringify({
        title: 'Shared',
      }),
      [`${wt}/conductor/archive/shared/plan.md`]: PLAN_DONE,
    });
    const reads = fakeReads({
      archiveDirs: { [MAIN]: ['shared'], '/w/feature-a': ['shared'] },
      files: { ...merge(MAIN), ...merge('/w/feature-a') },
    });

    const board = await loadBoard(reads, '/w');

    // The shared archived track appears in two worktrees but is counted once.
    expect(board.cards).toHaveLength(1);
    expect(board.progress).toEqual({ done: 3, total: 3, pct: 100 });
  });

  test('keeps a worktree with only archived tracks out of the idle lane', async () => {
    const reads = fakeReads({
      archiveDirs: { [MAIN]: ['only-one'] },
      files: {
        [`${MAIN}/conductor/archive/only-one/metadata.json`]: JSON.stringify({
          title: 'Only',
        }),
        [`${MAIN}/conductor/archive/only-one/plan.md`]: PLAN_DONE,
      },
    });

    const board = await loadBoard(reads, '/w');

    expect(board.idle.find((c) => c.worktreePath === MAIN)).toBeUndefined();
    expect(board.cards.some((c) => c.trackId === 'only-one')).toBe(true);
  });
});
