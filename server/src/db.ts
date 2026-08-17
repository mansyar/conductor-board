import { Database } from 'bun:sqlite';

/**
 * Current schema version. Stored in the database via `PRAGMA user_version`.
 * Bump this when the schema changes and add the matching SQL to `MIGRATIONS`.
 */
export const SCHEMA_VERSION = 2;

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

const SCHEMA_V2_SQL = `
  CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    observed_at TEXT NOT NULL,
    state_hash TEXT NOT NULL,
    done INTEGER NOT NULL,
    total INTEGER NOT NULL,
    spec_plan INTEGER NOT NULL,
    implement INTEGER NOT NULL,
    review INTEGER NOT NULL,
    complete INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_snapshots_project_time
    ON snapshots (project_id, observed_at);
`;

/** SQL required to reach each schema version, keyed by the target version. */
const MIGRATIONS: Record<number, string> = {
  1: SCHEMA_V1_SQL,
  2: SCHEMA_V2_SQL,
};

/**
 * Applies pending migrations in order until the database is at
 * {@link SCHEMA_VERSION}. Safe to call repeatedly; existing higher versions are
 * left untouched (never downgraded).
 */
export function migrate(db: Database): void {
  const row = db.query('PRAGMA user_version').get() as {
    user_version: number;
  };

  if (row.user_version >= SCHEMA_VERSION) {
    return;
  }

  for (
    let version = row.user_version + 1;
    version <= SCHEMA_VERSION;
    version += 1
  ) {
    const sql = MIGRATIONS[version];
    if (sql !== undefined) {
      db.exec(sql);
    }
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
