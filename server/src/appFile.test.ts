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
  root = await mkdtemp(join(tmpdir(), 'cb-file-'));
  validPath = join(root, 'valid');
  await mkdir(join(validPath, '.git'), { recursive: true });
  await mkdir(join(validPath, 'conductor'), { recursive: true });
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

function fakeReads(files: Record<string, string> = {}): ProjectReads {
  const map = new Map(Object.entries(files));
  return {
    async listWorktrees() {
      return [{ path: '/w/main', branch: 'main', detached: false }];
    },
    async readTextFile(worktreePath: string, relativePath: string) {
      const key = `${worktreePath}/${relativePath.replace(/\\/g, '/')}`;
      const content = map.get(key);
      if (content === undefined) {
        throw new Error(`Missing file ${key}`);
      }
      return content;
    },
    async isArchived() {
      return false;
    },
  };
}

function setup(reads: ProjectReads) {
  const db = new Database(':memory:');
  migrate(db);
  const app = createApp(db, { reads });
  const get = (path: string) =>
    app.handle(new Request(`http://localhost${path}`));
  return {
    get,
    async activate() {
      const res = await get('/api/projects');
      const api = app.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ path: validPath }),
        }),
      );
      const record = (await (await api).json()) as { id: number };
      await app.handle(
        new Request(`http://localhost/api/projects/${record.id}/active`, {
          method: 'PUT',
        }),
      );
      void res;
    },
  };
}

const PLAN = '# Plan\n\n- [x] Task: One\n';

describe('GET /api/file', () => {
  test('returns 409 before any project is activated', async () => {
    const { get } = setup(fakeReads());
    const res = await get(
      '/api/file?worktree=/w/main&path=conductor/tracks/x/plan.md',
    );
    expect(res.status).toBe(409);
  });

  test('returns 400 when query parameters are missing', async () => {
    const { get, activate } = setup(fakeReads());
    await activate();
    const res = await get('/api/file?worktree=/w/main');
    expect(res.status).toBe(400);
  });

  test('serves a confined file from a registered worktree', async () => {
    const { get, activate } = setup(
      fakeReads({
        '/w/main/conductor/tracks/x/plan.md': PLAN,
      }),
    );
    await activate();
    const res = await get(
      '/api/file?worktree=/w/main&path=conductor/tracks/x/plan.md',
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(PLAN);
  });

  test('returns 404 when the worktree is not registered', async () => {
    const { get, activate } = setup(fakeReads());
    await activate();
    const res = await get(
      '/api/file?worktree=/w/evil&path=conductor/tracks/x/plan.md',
    );
    expect(res.status).toBe(404);
  });

  test('rejects a traversal path escaping the worktree', async () => {
    const { get, activate } = setup(
      fakeReads({
        '/w/main/conductor/tracks/x/plan.md': PLAN,
      }),
    );
    await activate();
    const res = await get('/api/file?worktree=/w/main&path=../../password.txt');
    expect(res.status).toBe(403);
  });

  test('returns 404 when the file does not exist', async () => {
    const { get, activate } = setup(fakeReads());
    await activate();
    const res = await get(
      '/api/file?worktree=/w/main&path=conductor/tracks/missing/plan.md',
    );
    expect(res.status).toBe(404);
  });
});
