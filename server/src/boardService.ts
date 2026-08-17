import { archivedTitle } from './archiveTracks';
import {
  type Board,
  composeBoard,
  countPlanProgress,
  type TrackSource,
  type WorktreeGroup,
} from './board';
import { parseTracksRegistry } from './registry';
import type { WorktreeInfo } from './worktrees';

/**
 * Abstraction over the project file system so the board assembly can be tested
 * hermetically and, at runtime, backed by real git + fs calls.
 */
export interface ProjectReads {
  listWorktrees(projectPath: string): Promise<WorktreeInfo[]>;
  /** Reads a file relative to a worktree; rejects when it does not exist. */
  readTextFile(worktreePath: string, relativePath: string): Promise<string>;
  /** Whether a track folder exists under conductor/archive/. */
  isArchived(worktreePath: string, trackId: string): Promise<boolean>;
  /** Names of archived-track folders under conductor/archive/ ([] if absent). */
  listArchiveDirs(worktreePath: string): Promise<string[]>;
}

async function readOptional(
  reads: ProjectReads,
  worktreePath: string,
  relativePath: string,
): Promise<string> {
  try {
    return await reads.readTextFile(worktreePath, relativePath);
  } catch {
    return '';
  }
}

async function listArchiveDirsOrEmpty(
  reads: ProjectReads,
  worktreePath: string,
): Promise<string[]> {
  try {
    return await reads.listArchiveDirs(worktreePath);
  } catch {
    return [];
  }
}

/**
 * Assembles the board for a project. For each discovered worktree it reads the
 * conductor tracks registry, each track's plan.md progress, and archive status.
 * Archived tracks moved to conductor/archive/<id>/ but no longer present in the
 * registry are also surfaced as Complete cards. Worktrees that provide neither
 * a registry nor archived tracks are flagged as not initialized.
 */
export async function loadBoard(
  reads: ProjectReads,
  projectPath: string,
): Promise<Board> {
  const worktrees = await reads.listWorktrees(projectPath);
  const groups: WorktreeGroup[] = [];

  for (const worktree of worktrees) {
    const archiveIds = await listArchiveDirsOrEmpty(reads, worktree.path);

    let registryMd: string | null = null;
    try {
      registryMd = await reads.readTextFile(
        worktree.path,
        'conductor/tracks.md',
      );
    } catch {
      registryMd = null;
    }

    const tracks: TrackSource[] = [];

    if (registryMd !== null) {
      for (const entry of parseTracksRegistry(registryMd)) {
        let archived = false;
        try {
          archived = await reads.isArchived(worktree.path, entry.id);
        } catch {
          archived = false;
        }

        const planMd = await readOptional(
          reads,
          worktree.path,
          archived
            ? `conductor/archive/${entry.id}/plan.md`
            : `conductor/tracks/${entry.id}/plan.md`,
        );

        tracks.push({
          worktree,
          entry,
          archived,
          progress: countPlanProgress(planMd),
        });
      }
    }

    for (const id of archiveIds) {
      const metadata = await readOptional(
        reads,
        worktree.path,
        `conductor/archive/${id}/metadata.json`,
      );
      const planMd = await readOptional(
        reads,
        worktree.path,
        `conductor/archive/${id}/plan.md`,
      );
      tracks.push({
        worktree,
        entry: {
          state: 'x',
          id,
          description: archivedTitle(id, metadata),
          link: '',
        },
        archived: true,
        progress: countPlanProgress(planMd),
      });
    }

    if (registryMd === null && archiveIds.length === 0) {
      groups.push({ worktree, tracks: [], notInitialized: true });
      continue;
    }

    groups.push({ worktree, tracks });
  }

  return composeBoard(groups);
}
