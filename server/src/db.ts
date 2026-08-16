import { Database } from 'bun:sqlite';

/**
 * Current schema version. Stored in the database via `PRAGMA user_version`.
 * Bump this when the schema changes and extend `applyMigrations` accordingly.
 */
export const SCHEMA_VERSION = 1;

const SCHEMA_V1_SQL = `
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

/**
 * Applies pending migrations so the database is at {@link SCHEMA_VERSION}.
 * Safe to call repeatedly; existing higher versions are left untouched.
 */
export function migrate(db: Database): void {
  const row = db.query('PRAGMA user_version').get() as {
    user_version: number;
  };

  if (row.user_version >= SCHEMA_VERSION) {
    return;
  }

  if (row.user_version === 0) {
    db.exec(SCHEMA_V1_SQL);
  }

  db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

/**
 * Opens a SQLite database (file path or `:memory:`) and migrates it to the
 * current schema version.
 */
export function openDatabase(location: string): Database {
  const db = new Database(location);
  migrate(db);
  return db;
}
