export interface WorktreeInfo {
  path: string;
  /** Short branch name (refs/heads/ stripped), or null when detached. */
  branch: string | null;
  detached: boolean;
}

/**
 * Parses the output of `git worktree list --porcelain` into worktree records.
 * Handles `branch`, `detached`, and ignores unknown lines (bare, locked, ...).
 */
export function parseWorktreePorcelain(output: string): WorktreeInfo[] {
  const worktrees: WorktreeInfo[] = [];

  for (const block of output.split(/\n\s*\n/)) {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '');

    let path = '';
    let branch: string | null = null;
    let detached = false;

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        path = line.slice('worktree '.length).trim();
      } else if (line.startsWith('branch ')) {
        const ref = line.slice('branch '.length).trim();
        branch = ref.replace(/^refs\/heads\//, '');
      } else if (line === 'detached') {
        detached = true;
      }
    }

    if (path !== '') {
      worktrees.push({ path, branch, detached });
    }
  }

  return worktrees;
}
