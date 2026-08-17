/**
 * Renders the branch label for a card: a short `detached (<sha>)` label for
 * detached-HEAD worktrees, the branch name otherwise, or '' when neither is
 * available. The sha is truncated to a 7-char prefix for readability.
 */
export function branchLabel(
  branch: string | null,
  detached: boolean,
  headSha?: string | null,
): string {
  if (detached) {
    const sha = headSha ?? null;
    return sha === null || sha === ''
      ? 'detached'
      : `detached (${sha.slice(0, 7)})`;
  }
  return branch ?? '';
}
