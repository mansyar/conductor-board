import type { Database } from 'bun:sqlite';
import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

/**
 * Whether two (resolved) project paths refer to the same directory. Windows
 * paths are case-insensitive, so comparison is done on a lowercased, resolved
 * form while stored paths keep their original casing.
 */
export function sameProjectPath(a: string, b: string): boolean {
  return resolve(a).toLowerCase() === resolve(b).toLowerCase();
}

export interface Project {
  id: number;
  path: string;
  createdAt: string;
}

export interface ProjectRepository {
  list(): Project[];
  add(path: string): Promise<Project>;
  remove(id: number): boolean;
  setActive(id: number): void;
  getActive(): number | null;
}

interface ProjectRow {
  id: number;
  path: string;
  created_at: string;
}

/**
 * A project is acceptable if it exists, is a directory, and contains both a
 * `.git` marker and a `conductor/` directory.
 */
export async function isValidProjectPath(rawPath: string): Promise<boolean> {
  if (rawPath.trim() === '') {
    return false;
  }

  const target = resolve(rawPath);
  try {
    const stats = await stat(target);
    if (!stats.isDirectory()) {
      return false;
    }
  } catch {
    return false;
  }

  return (
    existsSync(join(target, '.git')) && existsSync(join(target, 'conductor'))
  );
}

function toProject(row: ProjectRow): Project {
  return { id: row.id, path: row.path, createdAt: row.created_at };
}

const ACTIVE_KEY = 'active_project_id';

export function createProjectRepository(db: Database): ProjectRepository {
  const selectAll = db.query(
    'SELECT id, path, created_at FROM projects ORDER BY path',
  );
  const selectById = db.query(
    'SELECT id, path, created_at FROM projects WHERE id = ?',
  );
  const insert = db.query('INSERT INTO projects (path) VALUES (?)');
  const removeStmt = db.query('DELETE FROM projects WHERE id = ?');
  const upsertSetting = db.query(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  );
  const getSetting = db.query('SELECT value FROM settings WHERE key = ?');

  function setSetting(key: string, value: string): void {
    upsertSetting.run(key, value);
  }

  function getSettingValue(key: string): string | null {
    const row = getSetting.get(key) as { value: string } | undefined;
    return row?.value ?? null;
  }

  function readActiveId(): number | null {
    const value = getSettingValue(ACTIVE_KEY);
    return value === null || value === '' ? null : Number(value);
  }

  function activate(id: number): void {
    const existing = selectById.get(id) as ProjectRow | null | undefined;
    if (existing === null || existing === undefined) {
      throw new Error(`Project ${id} not found`);
    }
    setSetting(ACTIVE_KEY, String(id));
  }

  return {
    list(): Project[] {
      const rows = selectAll.all() as ProjectRow[];
      return rows.map(toProject);
    },

    async add(path: string): Promise<Project> {
      if (!(await isValidProjectPath(path))) {
        throw new Error(`Not a git repo with a conductor/ directory: ${path}`);
      }
      const resolved = resolve(path);
      const alreadyAdded = selectAll
        .all()
        .some((row) => sameProjectPath((row as ProjectRow).path, resolved));
      if (alreadyAdded) {
        throw new Error(`Project already added: ${path}`);
      }
      const result = insert.run(resolved);
      const row = selectById.get(Number(result.lastInsertRowid)) as
        | ProjectRow
        | undefined;
      if (row === undefined) {
        throw new Error('Failed to add project');
      }
      const project = toProject(row);
      // Auto-activate the first project so the board renders without a click.
      if (readActiveId() === null) {
        activate(project.id);
      }
      return project;
    },

    remove(id: number): boolean {
      const result = removeStmt.run(id);
      const removed = result.changes > 0;
      if (removed && getSettingValue(ACTIVE_KEY) === String(id)) {
        setSetting(ACTIVE_KEY, '');
      }
      return removed;
    },

    setActive(id: number): void {
      activate(id);
    },

    getActive(): number | null {
      return readActiveId();
    },
  };
}
