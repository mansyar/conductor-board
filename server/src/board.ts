import { classifyPhase, type TrackPhase } from './classify';
import type { TrackEntry } from './registry';
import type { WorktreeInfo } from './worktrees';

export type ColumnId = TrackPhase;

export interface Progress {
  done: number;
  total: number;
  pct: number;
}

export interface TrackCard {
  worktreePath: string;
  branch: string | null;
  detached: boolean;
  trackId: string | null;
  trackName: string | null;
  /** Lifecycle column the card belongs to, or null when in the idle lane. */
  columnId: ColumnId | null;
  progress: Progress;
  /** True when the worktree has no conductor/ directory (not initialized). */
  notInitialized?: boolean;
}

export interface TrackSource {
  worktree: WorktreeInfo;
  entry: TrackEntry;
  archived: boolean;
  progress: Progress;
}

export interface WorktreeGroup {
  worktree: WorktreeInfo;
  /** Tracks found in this worktree; an empty array means "idle" worktree. */
  tracks: TrackSource[];
  /** True when the worktree has no conductor/ directory (not initialized). */
  notInitialized?: boolean;
}

export interface Board {
  columns: ColumnId[];
  cards: TrackCard[];
  idle: TrackCard[];
  progress: Progress;
}

export const COLUMNS: ColumnId[] = [
  'spec-plan',
  'implement',
  'review',
  'complete',
];

export const ZERO_PROGRESS: Progress = { done: 0, total: 0, pct: 0 };

function toProgress(done: number, total: number): Progress {
  return {
    done,
    total,
    pct: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

/**
 * Counts dispatched and total top-level `- [x|~| ] Task:` lines in a plan.md
 * document. Nested subtask lines are excluded from the tally.
 */
export function countPlanProgress(planMd: string): Progress {
  let done = 0;
  let total = 0;
  for (const line of planMd.split('\n')) {
    const match = line.match(/^\s*-\s*\[([ ~x])\]\s+Task:/);
    if (match === null) {
      continue;
    }
    total += 1;
    if (match[1] === 'x') {
      done += 1;
    }
  }
  return toProgress(done, total);
}

function idleCard(worktree: WorktreeInfo, notInitialized = false): TrackCard {
  return {
    worktreePath: worktree.path,
    branch: worktree.branch,
    detached: worktree.detached,
    trackId: null,
    trackName: null,
    columnId: null,
    progress: ZERO_PROGRESS,
    notInitialized,
  };
}

/**
 * Builds the board model from per-worktree track sources. Worktrees with no
 * tracks land in the idle lane; each track becomes one card in its classified
 * column. Progress is aggregated across all cards.
 */
export function composeBoard(groups: WorktreeGroup[]): Board {
  const cards: TrackCard[] = [];
  const idle: TrackCard[] = [];
  let done = 0;
  let total = 0;

  for (const group of groups) {
    if (group.tracks.length === 0) {
      idle.push(idleCard(group.worktree, group.notInitialized));
      continue;
    }

    for (const track of group.tracks) {
      const columnId = classifyPhase(track.entry.state, track.archived);
      cards.push({
        worktreePath: group.worktree.path,
        branch: group.worktree.branch,
        detached: group.worktree.detached,
        trackId: track.entry.id,
        trackName: track.entry.description,
        columnId,
        progress: track.progress,
      });
      done += track.progress.done;
      total += track.progress.total;
    }
  }

  return {
    columns: COLUMNS,
    cards,
    idle,
    progress: toProgress(done, total),
  };
}
