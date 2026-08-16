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
  trackId: string | null;
  trackName: string | null;
  columnId: ColumnId | null;
  progress: Progress;
  notInitialized?: boolean;
}

export interface Board {
  columns: ColumnId[];
  cards: TrackCard[];
  idle: TrackCard[];
  progress: Progress;
}
