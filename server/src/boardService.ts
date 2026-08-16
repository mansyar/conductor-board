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
}

/**
 * Assembles the board for a project. For each discovered worktree it reads the
 * conductor tracks registry, each track's plan.md progress, and archive status.
 * Worktrees that cannot provide a registry are flagged as not initialized.
 */
export async function loadBoard(
  reads: ProjectReads,
  projectPath: string,
): Promise<Board> {
  const worktrees = await reads.listWorktrees(projectPath);
  const groups: WorktreeGroup[] = [];

  for (const worktree of worktrees) {
    let registryMd: string;
    try {
      registryMd = await reads.readTextFile(
        worktree.path,
        'conductor/tracks.md',
      );
    } catch {
      groups.push({ worktree, tracks: [], notInitialized: true });
      continue;
    }

    const entries = parseTracksRegistry(registryMd);
    const tracks: TrackSource[] = [];

    for (const entry of entries) {
      let archived = false;
      try {
        archived = await reads.isArchived(worktree.path, entry.id);
      } catch {
        archived = false;
      }

      let planMd = '';
      try {
        planMd = await reads.readTextFile(
          worktree.path,
          `conductor/tracks/${entry.id}/plan.md`,
        );
      } catch {
        planMd = '';
      }

      tracks.push({
        worktree,
        entry,
        archived,
        progress: countPlanProgress(planMd),
      });
    }

    groups.push({ worktree, tracks });
  }

  return composeBoard(groups);
}
