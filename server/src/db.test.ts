import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import { migrate, SCHEMA_VERSION } from './db';

describe('database schema', () => {
  test('migrate sets PRAGMA user_version to SCHEMA_VERSION', () => {
    const db = new Database(':memory:');
    migrate(db);
    const row = db.query('PRAGMA user_version').get() as {
      user_version: number;
    };
    expect(row.user_version).toBe(SCHEMA_VERSION);
  });

  test('migrate creates the projects and settings tables', () => {
    const db = new Database(':memory:');
    migrate(db);
    const tables = db
      .query("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as { name: string }[];
    const names = tables.map((table) => table.name);
    expect(names).toContain('projects');
    expect(names).toContain('settings');
  });

  test('projects table has path unique constraint', () => {
    const db = new Database(':memory:');
    migrate(db);
    db.query('INSERT INTO projects (path) VALUES (?)').run('/tmp/a');
    expect(() =>
      db.query('INSERT INTO projects (path) VALUES (?)').run('/tmp/a'),
    ).toThrow();
  });

  test('migrate is idempotent', () => {
    const db = new Database(':memory:');
    migrate(db);
    migrate(db);
    migrate(db);
    const row = db.query('PRAGMA user_version').get() as {
      user_version: number;
    };
    expect(row.user_version).toBe(SCHEMA_VERSION);
  });

  test('migrate leaves projects empty', () => {
    const db = new Database(':memory:');
    migrate(db);
    const count = db.query('SELECT COUNT(*) AS c FROM projects').get() as {
      c: number;
    };
    expect(count.c).toBe(0);
  });

  test('migrate upgrades a v1 database to v2, preserving data', () => {
    const db = new Database(':memory:');
    // Simulate an existing v1 database with populated projects/settings.
    db.exec(`
      CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    db.query('INSERT INTO projects (path) VALUES (?)').run('/tmp/kept');
    db.query('INSERT INTO settings (key, value) VALUES (?, ?)').run('k', 'v');
    db.exec('PRAGMA user_version = 1');

    migrate(db);

    const tables = db
      .query("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as { name: string }[];
    const names = tables.map((table) => table.name);
    expect(names).toContain('snapshots');

    const indexes = db
      .query(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'snapshots'",
      )
      .all() as { name: string }[];
    expect(indexes.map((index) => index.name)).toContain(
      'idx_snapshots_project_time',
    );

    const projects = db.query('SELECT path FROM projects').all() as {
      path: string;
    }[];
    expect(projects).toEqual([{ path: '/tmp/kept' }]);

    const userVersion = db.query('PRAGMA user_version').get() as {
      user_version: number;
    };
    expect(userVersion.user_version).toBe(SCHEMA_VERSION);
  });
});
