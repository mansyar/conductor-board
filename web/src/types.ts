export interface Project {
  id: number;
  path: string;
  createdAt: string;
}

export interface ProjectsResponse {
  projects: Project[];
  activeId: number | null;
}

export interface Progress {
  done: number;
  total: number;
  pct: number;
}

export type ColumnId = 'spec-plan' | 'implement' | 'review' | 'complete';

export interface TrackCard {
  worktreePath: string;
  branch: string | null;
  detached: boolean;
  /** HEAD commit sha of the worktree (populated for detached HEAD display). */
  headSha: string | null;
  trackId: string | null;
  trackName: string | null;
  columnId: ColumnId | null;
  progress: Progress;
  /** Newest mtime (epoch ms) across the track's own conductor files, if any. */
  lastModifiedMs: number | null;
  /** True when this card represents an archived track. */
  archived?: boolean;
  notInitialized?: boolean;
}

export interface Board {
  columns: ColumnId[];
  cards: TrackCard[];
  idle: TrackCard[];
  progress: Progress;
}
