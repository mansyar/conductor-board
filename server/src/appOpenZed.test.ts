import { Database } from 'bun:sqlite';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from './app';
import type { ProjectReads } from './boardService';
import { migrate } from './db';
import type { ZedRunner } from './openZed';

let root: string;
let validPath: string;
let libPath: string;

interface WorktreeFixture {
  path: string;
  branch: string;
  detached: boolean;
}

let mainWorktree: WorktreeFixture;
let libWorktree: WorktreeFixture;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'cb-openzed-'));
  validPath = join(root, 'valid');
  await mkdir(join(validPath, '.git'), { recursive: true });
  await mkdir(join(validPath, 'conductor'), { recursive: true });
  libPath = join(root, 'lib');
  mainWorktree = { path: validPath, branch: 'main', detached: false };
  libWorktree = { path: libPath, branch: 'lib', detached: false };
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

function fakeReads(
  worktrees: WorktreeFixture[] = [mainWorktree],
): ProjectReads {
  return {
    listWorktrees: async () => worktrees,
    readTextFile: async () => '',
    isArchived: async () => false,
    listArchiveDirs: async () => [],
  };
}

interface SetupOpts {
  worktrees?: WorktreeFixture[];
  zedRejects?: boolean;
}

function setup(opts: SetupOpts = {}) {
  const opened: string[] = [];
  const zed: ZedRunner = {
    open: async (path: string) => {
      if (opts.zedRejects) {
        throw new Error('spawn zed ENOENT');
      }
      opened.push(path);
    },
  };
  const db = new Database(':memory:');
  migrate(db);
  const app = createApp(db, {
    reads: fakeReads(opts.worktrees),
    zed,
  });

  const post = (path: string, body: unknown) =>
    app.handle(
      new Request(`http://localhost${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
  const put = (path: string) =>
    app.handle(new Request(`http://localhost${path}`, { method: 'PUT' }));

  return { opened, post, put };
}

async function addActive(
  post: (path: string, body: unknown) => Promise<Response>,
  put: (path: string) => Promise<Response>,
) {
  const created = await post('/api/projects', { path: validPath });
  const record = (await created.json()) as { id: number };
  await put(`/api/projects/${record.id}/active`);
  return record;
}

describe('POST /api/open-zed', () => {
  test('spawns zed for a registered worktree and returns { opened: true }', async () => {
    const { opened, post, put } = setup();
    await addActive(post, put);

    const res = await post('/api/open-zed', { path: validPath });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { opened: boolean; path: string };
    expect(data.opened).toBe(true);
    expect(data.path).toBe(validPath);
    expect(opened).toEqual([validPath]);
  });

  test('returns 409 when no active project is selected', async () => {
    const { post } = setup();
    const res = await post('/api/open-zed', { path: validPath });
    expect(res.status).toBe(409);
  });

  test('returns 404 when a worktree is not part of the active project', async () => {
    const { post, put } = setup(); // default reads expose only mainWorktree
    await addActive(post, put);

    const res = await post('/api/open-zed', { path: libWorktree.path });
    expect(res.status).toBe(404);
  });

  test('rejects an escape / arbitrary path', async () => {
    const { post, put } = setup();
    await addActive(post, put);

    const escapePath = join(validPath, '..', '..', 'outside');
    const res = await post('/api/open-zed', { path: escapePath });
    expect(res.status).toBe(404);
  });

  test('returns 503 when spawning fails (zed not on PATH)', async () => {
    const { opened, post, put } = setup({ zedRejects: true });
    await addActive(post, put);

    const res = await post('/api/open-zed', { path: validPath });
    expect(res.status).toBe(503);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/zed/i);
    expect(opened).toEqual([]);
  });
});
