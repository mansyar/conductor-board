import { Database } from 'bun:sqlite';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createApp } from './app';
import { migrate } from './db';
import {
  createLiveService,
  type LiveService,
  type WatchHandle,
} from './liveUpdates';

let validPath: string;
let root: string;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'cb-live-'));
  validPath = join(root, 'valid');
  await mkdir(join(validPath, '.git'), { recursive: true });
  await mkdir(join(validPath, 'conductor'), { recursive: true });
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

function noopLive(): LiveService {
  return {
    subscribe() {
      return () => {};
    },
    async setActiveProject() {},
    broadcast() {},
    close() {},
  };
}

function setup(live?: LiveService) {
  const db = new Database(':memory:');
  migrate(db);
  const app = createApp(db, live === undefined ? {} : { live });
  const get = (path: string) =>
    app.handle(new Request(`http://localhost${path}`));
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
  const postJson = async (path: string, body: unknown) => {
    const res = await post(path, body);
    return (await res.json()) as Record<string, unknown>;
  };
  return { app, get, post, postJson, put };
}

describe('GET /api/events', () => {
  test('returns a kept-open text/event-stream response', async () => {
    const { get } = setup(noopLive());
    const res = await get('/api/events');

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    expect(res.body).not.toBeNull();

    const reader = res.body?.getReader();
    await reader?.cancel();
  });

  test('does not error when no project is active (graceful connect)', async () => {
    const { get } = setup(noopLive());
    const res = await get('/api/events');
    expect(res.status).toBe(200);
    const reader = res.body?.getReader();
    await reader?.cancel();
  });

  test('a conductor change is delivered to a connected client', async () => {
    const changes: (() => void)[] = [];
    const live = createLiveService({
      debounceWaitMs: 10,
      async listWorktrees() {
        return [{ path: validPath }];
      },
      watch(_dir, onEvent): WatchHandle {
        changes.push(onEvent);
        return { close() {} };
      },
    });
    const { app, postJson, put } = setup(live);

    await postJson('/api/projects', { path: validPath });
    await put('/api/projects/1/active');

    const res = await app.handle(new Request('http://localhost/api/events'));
    const reader = res.body?.getReader();

    await delay(30);
    expect(changes.length).toBe(1);
    changes[0]();
    await delay(30);

    const { value } = (await reader?.read()) ?? {};
    const text = new TextDecoder().decode(value);
    expect(text).toContain('board-changed');
    await reader?.cancel();
  });
});

describe('active-project sync', () => {
  test('activating a project re-points the live service at its worktrees', async () => {
    const calls: (string | null)[] = [];
    const live: LiveService = {
      subscribe() {
        return () => {};
      },
      async setActiveProject(projectPath) {
        calls.push(projectPath);
      },
      broadcast() {},
      close() {},
    };
    const { postJson, put } = setup(live);

    await postJson('/api/projects', { path: validPath });
    await put('/api/projects/1/active');

    expect(calls).toContain(validPath);
  });
});
