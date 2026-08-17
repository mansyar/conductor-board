import type { Database } from 'bun:sqlite';

export interface PreferencesRepository {
  getExpandedMonths(projectId: number): string[];
  setExpandedMonths(projectId: number, months: string[]): void;
}

function keyFor(projectId: number): string {
  return `complete_expanded_months:${projectId}`;
}

/** Per-project UI preferences persisted in the board's `settings` table. */
export function createPreferencesRepository(
  db: Database,
): PreferencesRepository {
  const getStmt = db.query('SELECT value FROM settings WHERE key = ?');
  const upsertStmt = db.query(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  );

  function getExpandedMonths(projectId: number): string[] {
    const row = getStmt.get(keyFor(projectId)) as {
      value: string;
    } | null;
    if (row === null || row.value === '') {
      return [];
    }
    try {
      const parsed = JSON.parse(row.value) as unknown;
      return Array.isArray(parsed) &&
        parsed.every((value) => typeof value === 'string')
        ? parsed
        : [];
    } catch {
      return [];
    }
  }

  return {
    getExpandedMonths,
    setExpandedMonths(projectId, months) {
      upsertStmt.run(keyFor(projectId), JSON.stringify(months));
    },
  };
}
