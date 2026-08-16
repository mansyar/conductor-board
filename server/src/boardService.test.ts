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

interface FakeOptions {
  files?: Record<string, string>;
  archived?: string[];
  /** Keys (relative paths) that should be readable even if absent from files. */
}

function fakeReads(options: FakeOptions = {}): ProjectReads {
  const files = new Map(Object.entries(options.files ?? {}));
  const archived = new Set(options.archived ?? []);

  return {
    async listWorktrees(): Promise<WorktreeInfo[]> {
      return [
        { path: '/w/main', branch: 'main', detached: false },
        { path: '/w/feature-a', branch: 'feature-a', detached: false },
      ];
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
});
