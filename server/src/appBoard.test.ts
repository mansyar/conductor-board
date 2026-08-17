import { Database } from 'bun:sqlite';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from './app';
import type { ProjectReads } from './boardService';
import { migrate } from './db';

let validPath: string;
let root: string;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'cb-board-'));
  validPath = join(root, 'valid');
  await mkdir(join(validPath, '.git'), { recursive: true });
  await mkdir(join(validPath, 'conductor'), { recursive: true });
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

function fakeReads(files: Record<string, string> = {}): ProjectReads {
  return {
    async listWorktrees() {
      return [
        { path: '/w/main', branch: 'main', detached: false, headSha: null },
      ];
    },
    async readTextFile(worktreePath: string, relativePath: string) {
      const key = `${worktreePath}/${relativePath}`;
      const content = files[key];
      if (content === undefined) {
        throw new Error(`Missing file ${key}`);
      }
      return content;
    },
    async isArchived() {
      return false;
    },
    async listArchiveDirs() {
      return [];
    },
    async readMtimeMs() {
      return null;
    },
  };
}

function setup(reads: ProjectReads) {
  const db = new Database(':memory:');
  migrate(db);
  const app = createApp(db, { reads });
  return {
    app,
    db,
    async addProject() {
      const res = await app.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ path: validPath }),
        }),
      );
      const record = (await res.json()) as { id: number };
      await app.handle(
        new Request(`http://localhost/api/projects/${record.id}/active`, {
          method: 'PUT',
        }),
      );
      return record;
    },
  };
}

describe('GET /api/board', () => {
  test('returns 409 before any project is activated', async () => {
    const { app } = setup(fakeReads());
    const res = await app.handle(new Request('http://localhost/api/board'));
    expect(res.status).toBe(409);
  });

  test('returns the board response shape once a project is active', async () => {
    const reads = fakeReads({
      '/w/main/conductor/tracks.md': [
        '- [ ] **Track: Spec Track** *Link: [tracks/spec_20260101/index.md](./tracks/spec_20260101/index.md)*',
      ].join('\n'),
      '/w/main/conductor/tracks/spec_20260101/plan.md': [
        '- [x] Task: One',
        '- [ ] Task: Two',
      ].join('\n'),
    });
    const { app, addProject } = setup(reads);
    await addProject();

    const res = await app.handle(new Request('http://localhost/api/board'));
    expect(res.status).toBe(200);

    const board = (await res.json()) as {
      columns: string[];
      cards: unknown[];
      idle: unknown[];
      progress: { done: number; total: number; pct: number };
    };

    expect(board.columns).toEqual([
      'spec-plan',
      'implement',
      'review',
      'complete',
    ]);
    expect(board.cards).toHaveLength(1);
    const card = board.cards[0] as Record<string, unknown>;
    expect(card.columnId).toBe('spec-plan');
    expect(card.trackId).toBe('spec_20260101');
    expect(card.progress).toEqual({ done: 1, total: 2, pct: 50 });
    expect(board.idle).toHaveLength(0);
    expect(board.progress).toEqual({ done: 1, total: 2, pct: 50 });
  });
});

function snapshotCount(db: Database): number {
  const row = db.query('SELECT COUNT(*) AS c FROM snapshots').get() as {
    c: number;
  };
  return row.c;
}

describe('snapshot recording and /api/history', () => {
  test('records one snapshot per distinct board state', async () => {
    const files: Record<string, string> = {
      '/w/main/conductor/tracks.md':
        '- [ ] **Track: A** *Link: [a_1/index.md](./tracks/a_1/index.md)*',
      '/w/main/conductor/tracks/a_1/plan.md': '- [x] Task: One',
    };
    const { app, addProject, db } = setup(fakeReads(files));
    await addProject();

    await app.handle(new Request('http://localhost/api/board'));
    await app.handle(new Request('http://localhost/api/board'));
    expect(snapshotCount(db)).toBe(1);

    files['/w/main/conductor/tracks/a_1/plan.md'] =
      '- [x] Task: One\n- [x] Task: Two';
    await app.handle(new Request('http://localhost/api/board'));
    expect(snapshotCount(db)).toBe(2);
  });

  test('returns 409 for /api/history before a project is active', async () => {
    const { app } = setup(fakeReads());
    const res = await app.handle(new Request('http://localhost/api/history'));
    expect(res.status).toBe(409);
  });

  test('returns ascending snapshots for the active project', async () => {
    const files: Record<string, string> = {
      '/w/main/conductor/tracks.md':
        '- [ ] **Track: A** *Link: [a_1/index.md](./tracks/a_1/index.md)*',
      '/w/main/conductor/tracks/a_1/plan.md': '- [x] Task: One',
    };
    const { app, addProject } = setup(fakeReads(files));
    await addProject();

    await app.handle(new Request('http://localhost/api/board'));
    files['/w/main/conductor/tracks/a_1/plan.md'] =
      '- [x] Task: One\n- [x] Task: Two';
    await app.handle(new Request('http://localhost/api/board'));

    const res = await app.handle(new Request('http://localhost/api/history'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      projectId: number;
      snapshots: Array<{ done: number; total: number; specPlan: number }>;
    };
    expect(body.projectId).toBeGreaterThan(0);
    expect(body.snapshots.map((snapshot) => snapshot.done)).toEqual([1, 2]);
    expect(body.snapshots.map((snapshot) => snapshot.total)).toEqual([1, 2]);
    expect(body.snapshots.map((snapshot) => snapshot.specPlan)).toEqual([1, 1]);
  });
});
