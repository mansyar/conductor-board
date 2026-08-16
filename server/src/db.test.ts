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
});
