import type { Database } from 'bun:sqlite';
import { relative, resolve } from 'node:path';
import { Elysia, t } from 'elysia';
import { loadBoard, type ProjectReads } from './boardService';
import { resolveWithin } from './fileAccess';
import { createFsProjectReads } from './fsProjectReads';
import { createProjectRepository } from './projects';

export type App = ReturnType<typeof createApp>;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

/**
 * Builds the Elysia app bound to the given database. Used directly in tests
 * (with an in-memory DB) and by the server entrypoint (with a file-backed DB).
 * `deps.reads` may be overridden in tests with a fake ProjectReads.
 */
export function createApp(db: Database, deps?: { reads?: ProjectReads }) {
  const projects = createProjectRepository(db);
  const reads = deps?.reads ?? createFsProjectReads();

  return new Elysia()
    .get('/health', () => ({ status: 'ok' }))
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
      return { removed: true };
    })
    .put('/api/projects/:id/active', ({ params, set }) => {
      const id = Number(params.id);
      try {
        projects.setActive(id);
        return { activeId: id };
      } catch {
        set.status = 404;
        return { error: 'Project not found' };
      }
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
}
