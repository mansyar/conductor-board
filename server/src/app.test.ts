import { Database } from 'bun:sqlite';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from './app';
import { migrate } from './db';

let validPath: string;
let validPath2: string;
let root: string;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'cb-app-'));
  validPath = join(root, 'valid');
  validPath2 = join(root, 'valid2');
  for (const dir of [validPath, validPath2]) {
    await mkdir(join(dir, '.git'), { recursive: true });
    await mkdir(join(dir, 'conductor'), { recursive: true });
  }
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

function setup() {
  const db = new Database(':memory:');
  migrate(db);
  const app = createApp(db);
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
  const del = (path: string) =>
    app.handle(new Request(`http://localhost${path}`, { method: 'DELETE' }));
  const put = (path: string) =>
    app.handle(new Request(`http://localhost${path}`, { method: 'PUT' }));
  const getJson = async (path: string) => {
    const res = await get(path);
    return (await res.json()) as Record<string, unknown>;
  };
  return { db, app, get, getJson, post, del, put };
}

describe('GET /api/projects', () => {
  test('returns an empty list and null active id initially', async () => {
    const { get, getJson } = setup();
    const res = await get('/api/projects');
    expect(res.status).toBe(200);
    const payload = (await getJson('/api/projects')) as {
      projects: unknown[];
      activeId: null;
    };
    expect(payload.projects).toEqual([]);
    expect(payload.activeId).toBeNull();
  });
});

describe('POST /api/projects', () => {
  test('adds a valid project and returns 201 with the record', async () => {
    const { post } = setup();
    const res = await post('/api/projects', { path: validPath });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: number; path: string };
    expect(data.id).toBeGreaterThan(0);
    expect(data.path).toBe(validPath);
  });

  test('rejects an invalid path with 400 and a clear error', async () => {
    const { post } = setup();
    const res = await post('/api/projects', {
      path: '/definitely/not/a/git/repo',
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/git repo/);
  });

  test('rejects a missing body with 400', async () => {
    const { post } = setup();
    const res = await post('/api/projects', undefined);
    expect(res.status).toBe(422);
  });

  test('rejects a duplicate path with a friendly already-added error', async () => {
    const { post } = setup();
    const first = await post('/api/projects', { path: validPath });
    expect(first.status).toBe(201);
    const res = await post('/api/projects', { path: validPath });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/already added/i);
  });

  test('first added project becomes the active project', async () => {
    const { post, getJson } = setup();
    const created = await post('/api/projects', { path: validPath });
    const record = (await created.json()) as { id: number };
    const list = (await getJson('/api/projects')) as {
      activeId: number | null;
    };
    expect(list.activeId).toBe(record.id);
  });

  test('adding a second project while one is active leaves the active unchanged', async () => {
    const { post, getJson } = setup();
    const first = await post('/api/projects', { path: validPath });
    const firstRecord = (await first.json()) as { id: number };
    const second = await post('/api/projects', { path: validPath2 });
    const secondRecord = (await second.json()) as { id: number };
    expect(secondRecord.id).not.toBe(firstRecord.id);
    const list = (await getJson('/api/projects')) as {
      activeId: number | null;
    };
    expect(list.activeId).toBe(firstRecord.id);
  });
});

describe('DELETE /api/projects/:id', () => {
  test('removes an existing project', async () => {
    const { post, del, getJson } = setup();
    const created = await post('/api/projects', { path: validPath });
    const record = (await created.json()) as { id: number };
    const res = await del(`/api/projects/${record.id}`);
    expect(res.status).toBe(200);
    const list = (await getJson('/api/projects')) as {
      projects: unknown[];
    };
    expect(list.projects.length).toBe(0);
  });

  test('returns 404 for a missing project', async () => {
    const { del } = setup();
    const res = await del('/api/projects/999999');
    expect(res.status).toBe(404);
  });

  test('removes the project snapshots when deleting', async () => {
    const { db, post, del } = setup();
    const created = await post('/api/projects', { path: validPath });
    const record = (await created.json()) as { id: number };
    db.query(
      'INSERT INTO snapshots (project_id, observed_at, state_hash, done, total, spec_plan, implement, review, complete) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(record.id, '2026-08-17T00:00:00.000Z', 'h', 1, 2, 1, 0, 0, 0);

    await del(`/api/projects/${record.id}`);

    const count = db.query('SELECT COUNT(*) AS c FROM snapshots').get() as {
      c: number;
    };
    expect(count.c).toBe(0);
  });
});

describe('PUT /api/projects/:id/active', () => {
  test('sets the active project', async () => {
    const { post, put, getJson } = setup();
    const created = await post('/api/projects', { path: validPath });
    const record = (await created.json()) as { id: number };
    const res = await put(`/api/projects/${record.id}/active`);
    expect(res.status).toBe(200);
    const list = (await getJson('/api/projects')) as {
      activeId: number | null;
    };
    expect(list.activeId).toBe(record.id);
  });

  test('returns 404 for a missing project', async () => {
    const { put } = setup();
    const res = await put('/api/projects/999999/active');
    expect(res.status).toBe(404);
  });
});

describe('static frontend serving (build present)', () => {
  let distRoot: string;
  const build = '<!doctype html><title>board</title>';

  beforeAll(async () => {
    distRoot = await mkdtemp(join(tmpdir(), 'cb-dist-'));
    await mkdir(join(distRoot, 'assets'), { recursive: true });
    await writeFile(join(distRoot, 'index.html'), build);
    await writeFile(join(distRoot, 'assets', 'app.js'), 'console.log("hi")');
  });

  afterAll(async () => {
    await rm(distRoot, { recursive: true, force: true });
  });

  function setup() {
    const db = new Database(':memory:');
    migrate(db);
    const app = createApp(db, { static: { distDir: distRoot } });
    const get = (path: string) =>
      app.handle(new Request(`http://localhost${path}`));
    return { get };
  }

  test('serves index.html at / and for non-/api paths (SPA fallback)', async () => {
    const { get } = setup();
    const root = await get('/');
    expect(root.status).toBe(200);
    expect(await root.text()).toBe(build);
    const fallback = await get('/some/client/route');
    expect(fallback.status).toBe(200);
    expect(await fallback.text()).toBe(build);
  });

  test('serves built assets from the dist root', async () => {
    const { get } = setup();
    const res = await get('/assets/app.js');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('console.log("hi")');
  });

  test('/api routes keep returning JSON and unknown /api returns 404', async () => {
    const { get } = setup();
    const health = await get('/health');
    expect(health.status).toBe(200);
    expect(health.headers.get('content-type')).toContain('application/json');
    const unknown = await get('/api/nope');
    expect(unknown.status).toBe(404);
    expect(unknown.headers.get('content-type')).toContain('application/json');
  });
});

describe('static serving disabled without a build', () => {
  let distRoot: string;

  beforeAll(async () => {
    distRoot = await mkdtemp(join(tmpdir(), 'cb-nodist-'));
  });

  afterAll(async () => {
    await rm(distRoot, { recursive: true, force: true });
  });

  test('non-/api GET is not served as HTML and /api still works', async () => {
    const db = new Database(':memory:');
    migrate(db);
    const app = createApp(db, { static: { distDir: distRoot } });
    const notServed = await app.handle(new Request('http://localhost/path'));
    expect(notServed.status).toBe(404);
    expect(notServed.headers.get('content-type') ?? '').not.toContain(
      'text/html',
    );
    const health = await app.handle(new Request('http://localhost/health'));
    expect(health.status).toBe(200);
  });
});
