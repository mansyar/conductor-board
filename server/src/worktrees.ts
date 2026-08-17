export interface WorktreeInfo {
  path: string;
  /** Short branch name (refs/heads/ stripped), or null when detached. */
  branch: string | null;
  detached: boolean;
  /** The HEAD commit sha for this worktree (useful for detached HEADs), or null. */
  headSha: string | null;
}

/**
 * Parses the output of `git worktree list --porcelain` into worktree records.
 * Handles `branch`, `detached`, `HEAD`, and ignores unknown lines (bare, locked, ...).
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
    let headSha: string | null = null;

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        path = line.slice('worktree '.length).trim();
      } else if (line.startsWith('branch ')) {
        const ref = line.slice('branch '.length).trim();
        branch = ref.replace(/^refs\/heads\//, '');
      } else if (line === 'detached') {
        detached = true;
      } else if (line.startsWith('HEAD ')) {
        headSha = line.slice('HEAD '.length).trim() || null;
      }
    }

    if (path !== '') {
      worktrees.push({ path, branch, detached, headSha });
    }
  }

  return worktrees;
}
