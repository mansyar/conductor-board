import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createApp } from './app';
import { openDatabase } from './db';

const port = Number(process.env.PORT ?? 3001);
const dataDir = join(import.meta.dir, '..', 'data');
mkdirSync(dataDir, { recursive: true });

const db = openDatabase(join(dataDir, 'board.db'));
const app = createApp(db).listen(port);

export type App = typeof app;

console.log(
  `Conductor Board server running at http://${app.server?.hostname}:${app.server?.port}`,
);
