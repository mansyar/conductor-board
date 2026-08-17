import { describe, expect, test } from 'bun:test';
import { openDatabase } from './db';
import type { BoardSummary } from './history';
import { createSnapshotRepository } from './historyRepository';

function summary(overrides: Partial<BoardSummary> = {}): BoardSummary {
  return {
    done: 1,
    total: 2,
    specPlan: 1,
    implement: 0,
    review: 0,
    complete: 0,
    ...overrides,
  };
}

describe('snapshot repository', () => {
  test('inserts a snapshot and returns the latest hash', () => {
    const db = openDatabase(':memory:');
    const repo = createSnapshotRepository(db);
    repo.insert(1, summary(), '2026-08-17T00:00:00.000Z', 'hash-1');
    expect(repo.latestHash(1)).toBe('hash-1');
  });

  test('returns null as the latest hash when none exist', () => {
    const db = openDatabase(':memory:');
    const repo = createSnapshotRepository(db);
    expect(repo.latestHash(1)).toBeNull();
  });

  test('returns recent snapshots ascending, capped by the limit', () => {
    const db = openDatabase(':memory:');
    const repo = createSnapshotRepository(db);
    repo.insert(1, summary({ done: 1 }), '2026-08-17T00:00:00.000Z', 'h1');
    repo.insert(1, summary({ done: 2 }), '2026-08-17T00:01:00.000Z', 'h2');
    repo.insert(1, summary({ done: 3 }), '2026-08-17T00:02:00.000Z', 'h3');

    const snapshots = repo.listRecent(1, 2);
    expect(snapshots.map((snapshot) => snapshot.done)).toEqual([2, 3]);
    expect(snapshots[0].observedAt).toBe('2026-08-17T00:01:00.000Z');
    expect(snapshots[1].observedAt).toBe('2026-08-17T00:02:00.000Z');
  });

  test('scopes snapshots by project', () => {
    const db = openDatabase(':memory:');
    const repo = createSnapshotRepository(db);
    repo.insert(1, summary({ done: 1 }), '2026-08-17T00:00:00.000Z', 'h1');
    repo.insert(2, summary({ done: 9 }), '2026-08-17T00:01:00.000Z', 'h2');

    expect(repo.latestHash(1)).toBe('h1');
    expect(repo.listRecent(1, 10)).toHaveLength(1);
    expect(repo.listRecent(2, 10)).toHaveLength(1);
  });
});
