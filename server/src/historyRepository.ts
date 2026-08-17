import type { Database } from 'bun:sqlite';
import type { BoardSummary } from './history';

export interface Snapshot {
  id: number;
  projectId: number;
  observedAt: string;
  stateHash: string;
  done: number;
  total: number;
  specPlan: number;
  implement: number;
  review: number;
  complete: number;
}

export interface SnapshotRepository {
  insert(
    projectId: number,
    summary: BoardSummary,
    observedAt: string,
    stateHash: string,
  ): number;
  latestHash(projectId: number): string | null;
  listRecent(projectId: number, limit: number): Snapshot[];
  deleteByProject(projectId: number): number;
}

interface SnapshotRow {
  id: number;
  project_id: number;
  observed_at: string;
  state_hash: string;
  done: number;
  total: number;
  spec_plan: number;
  implement: number;
  review: number;
  complete: number;
}

function toSnapshot(row: SnapshotRow): Snapshot {
  return {
    id: row.id,
    projectId: row.project_id,
    observedAt: row.observed_at,
    stateHash: row.state_hash,
    done: row.done,
    total: row.total,
    specPlan: row.spec_plan,
    implement: row.implement,
    review: row.review,
    complete: row.complete,
  };
}

/** Persistence for phase-history snapshots in the board's own SQLite database. */
export function createSnapshotRepository(db: Database): SnapshotRepository {
  const insertStmt = db.query(`
    INSERT INTO snapshots
      (project_id, observed_at, state_hash, done, total, spec_plan, implement, review, complete)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const latestHashStmt = db.query(
    'SELECT state_hash FROM snapshots WHERE project_id = ? ORDER BY observed_at DESC, id DESC LIMIT 1',
  );

  const listRecentStmt = db.query(`
    SELECT * FROM (
      SELECT * FROM snapshots
      WHERE project_id = ?
      ORDER BY observed_at DESC, id DESC
      LIMIT ?
    )
    ORDER BY observed_at ASC, id ASC
  `);

  const deleteByProjectStmt = db.query(
    'DELETE FROM snapshots WHERE project_id = ?',
  );

  return {
    insert(projectId, summary, observedAt, stateHash) {
      const result = insertStmt.run(
        projectId,
        observedAt,
        stateHash,
        summary.done,
        summary.total,
        summary.specPlan,
        summary.implement,
        summary.review,
        summary.complete,
      );
      return Number(result.lastInsertRowid);
    },

    latestHash(projectId) {
      const row = latestHashStmt.get(projectId) as
        | { state_hash: string }
        | undefined;
      return row?.state_hash ?? null;
    },

    listRecent(projectId, limit) {
      const rows = listRecentStmt.all(projectId, limit) as SnapshotRow[];
      return rows.map(toSnapshot);
    },

    deleteByProject(projectId) {
      return deleteByProjectStmt.run(projectId).changes;
    },
  };
}
