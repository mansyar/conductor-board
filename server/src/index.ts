import { Elysia } from 'elysia';

const app = new Elysia().get('/health', () => ({ status: 'ok' })).listen(3001);

export type App = typeof app;

console.log(
  `Conductor Board server running at http://${app.server?.hostname}:${app.server?.port}`,
);
