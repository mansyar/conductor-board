import type { Database } from 'bun:sqlite';
import { existsSync, watch } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { staticPlugin } from '@elysiajs/static';
import { Elysia, t } from 'elysia';
import { loadBoard, type ProjectReads } from './boardService';
import { isRealPathWithin, resolveWithin } from './fileAccess';
import { createFsProjectReads } from './fsProjectReads';
import {
  createLiveService,
  type LiveService,
  type WatchHandle,
} from './liveUpdates';
import { createZedRunner, type ZedRunner } from './openZed';
import { createProjectRepository } from './projects';
import { staticServeConfig } from './staticServe';

export type App = ReturnType<typeof createApp>;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

/**
 * Production watcher: recursively watches a directory with Bun's `fs.watch`
 * and swallows async 'error' events so an unwatchable dir never crashes the
 * server. Throws synchronously when recursive watching is unsupported.
 */
function realWatch(dir: string, onEvent: () => void): WatchHandle {
  const watcher = watch(dir, { recursive: true }, () => onEvent());
  watcher.on('error', () => {
    // Ignore; the service skips unwatchable dirs gracefully.
  });
  return { close: () => watcher.close() };
}

/**
 * Builds the Elysia app bound to the given database. Used directly in tests
 * (with an in-memory DB) and by the server entrypoint (with a file-backed DB).
 * `deps.reads`, `deps.zed`, and `deps.live` may be overridden in tests with
 * fakes.
 */
export function createApp(
  db: Database,
  deps?: {
    reads?: ProjectReads;
    zed?: ZedRunner;
    live?: LiveService;
    static?: { distDir?: string };
  },
) {
  const projects = createProjectRepository(db);
  const reads = deps?.reads ?? createFsProjectReads();
  const zed = deps?.zed ?? createZedRunner();
  const live =
    deps?.live ??
    createLiveService({ listWorktrees: reads.listWorktrees, watch: realWatch });

  // Serve the compiled SPA (web/dist) only when a build exists, so the dev loop
  // (Vite + `/api` proxy) is unaffected during development.
  const distDir =
    deps?.static?.distDir ?? join(import.meta.dir, '..', '..', 'web', 'dist');
  const { enabled, indexHtml } = staticServeConfig(distDir);

  /** Point the live service at whatever project is currently active. */
  function syncActiveProject(): void {
    const activeId = projects.getActive();
    const project =
      activeId === null
        ? undefined
        : projects.list().find((p) => p.id === activeId);
    void live.setActiveProject(project?.path ?? null);
  }
  syncActiveProject();

  const app = new Elysia()
    .get('/health', () => ({ status: 'ok' }))
    .get('/api/events', () => {
      let unsubscribe: (() => void) | undefined;
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const encoder = new TextEncoder();
          unsubscribe = live.subscribe((message) => {
            try {
              controller.enqueue(encoder.encode(message));
            } catch {
              // Stream already closed; the client has gone away.
            }
          });
        },
        cancel() {
          unsubscribe?.();
        },
      });
      return new Response(stream, {
        headers: {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
        },
      });
    })
    .get('/api/projects', () => ({
      projects: projects.list(),
      activeId: projects.getActive(),
    }))
    .post(
      '/api/projects',
      async ({ body, set }) => {
        try {
          set.status = 201;
          return await projects.add(body.path);
        } catch (error) {
          set.status = 400;
          return { error: errorMessage(error) };
        }
      },
      { body: t.Object({ path: t.String() }) },
    )
    .delete('/api/projects/:id', ({ params, set }) => {
      const removed = projects.remove(Number(params.id));
      if (!removed) {
        set.status = 404;
        return { error: 'Project not found' };
      }
      syncActiveProject();
      return { removed: true };
    })
    .put('/api/projects/:id/active', ({ params, set }) => {
      const id = Number(params.id);
      try {
        projects.setActive(id);
      } catch {
        set.status = 404;
        return { error: 'Project not found' };
      }
      syncActiveProject();
      return { activeId: id };
    })
    .get('/api/board', async ({ set }) => {
      const activeId = projects.getActive();
      if (activeId === null) {
        set.status = 409;
        return { error: 'No active project selected' };
      }
      const project = projects.list().find((p) => p.id === activeId);
      if (project === undefined) {
        set.status = 404;
        return { error: 'Active project not found' };
      }
      return await loadBoard(reads, project.path);
    })
    .post(
      '/api/open-zed',
      async ({ body, set }) => {
        const activeId = projects.getActive();
        if (activeId === null) {
          set.status = 409;
          return { error: 'No active project selected' };
        }
        const project = projects.list().find((p) => p.id === activeId);
        if (project === undefined) {
          set.status = 404;
          return { error: 'Active project not found' };
        }

        const worktrees = await reads.listWorktrees(project.path);
        const worktree = worktrees.find(
          (w) =>
            resolve(w.path).toLowerCase() === resolve(body.path).toLowerCase(),
        );
        if (worktree === undefined) {
          set.status = 404;
          return { error: 'Worktree not found in the active project' };
        }

        try {
          await zed.open(worktree.path);
        } catch {
          set.status = 503;
          return {
            error:
              'Could not launch Zed. Ensure the `zed` CLI is installed and on your PATH.',
          };
        }
        return { opened: true, path: worktree.path };
      },
      { body: t.Object({ path: t.String() }) },
    )
    .get('/api/file', async ({ query, set }) => {
      const qs = query as Record<string, string | undefined>;
      const worktreeParam = qs.worktree ?? '';
      const filePath = qs.path ?? '';
      if (worktreeParam === '' || filePath === '') {
        set.status = 400;
        return { error: 'worktree and path query parameters are required' };
      }

      const activeId = projects.getActive();
      if (activeId === null) {
        set.status = 409;
        return { error: 'No active project selected' };
      }
      const project = projects.list().find((p) => p.id === activeId);
      if (project === undefined) {
        set.status = 404;
        return { error: 'Active project not found' };
      }

      const worktrees = await reads.listWorktrees(project.path);
      const worktree = worktrees.find(
        (w) =>
          resolve(w.path).toLowerCase() ===
          resolve(worktreeParam).toLowerCase(),
      );
      if (worktree === undefined) {
        set.status = 404;
        return { error: 'Worktree not found in the active project' };
      }

      const target = resolveWithin(worktree.path, filePath);
      if (target === null) {
        set.status = 403;
        return { error: 'Path escapes the worktree' };
      }

      if (!(await isRealPathWithin(worktree.path, target))) {
        set.status = 403;
        return { error: 'Path escapes the worktree' };
      }

      const relPath = relative(worktree.path, target);
      let content: string;
      try {
        content = await reads.readTextFile(worktree.path, relPath);
      } catch {
        set.status = 404;
        return { error: 'File not found' };
      }
      return new Response(content, {
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    });

  if (enabled) {
    app.use(staticPlugin({ assets: distDir, prefix: '/' }));
  }

  // SPA history fallback for non-/api GET misses. Matched routes (incl. `/api/*`)
  // win first; an existing file in the dist root is served directly (so assets
  // resolve even when the static plugin doesn't set a content type), otherwise
  // index.html is returned (`200`) to support future client-side routes. An
  // unknown `/api/*` path returns 404 (JSON) rather than HTML.
  app.get('*', ({ path, set }) => {
    if (path.startsWith('/api')) {
      set.status = 404;
      return { error: 'Not found' };
    }
    if (indexHtml === null) {
      set.status = 404;
      return 'Not found';
    }
    const rel = decodeURIComponent(path.replace(/^\/+/, '').split('?')[0]);
    const target = rel === '' ? null : resolveWithin(distDir, rel);
    if (target !== null && existsSync(target)) {
      return new Response(Bun.file(target));
    }
    return new Response(Bun.file(indexHtml), {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  });

  return app;
}
