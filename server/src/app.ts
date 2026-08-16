import type { Database } from 'bun:sqlite';
import { Elysia, t } from 'elysia';
import { createProjectRepository } from './projects';

export type App = ReturnType<typeof createApp>;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

/**
 * Builds the Elysia app bound to the given database. Used directly in tests
 * (with an in-memory DB) and by the server entrypoint (with a file-backed DB).
 */
export function createApp(db: Database) {
  const projects = createProjectRepository(db);

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
    });
}
