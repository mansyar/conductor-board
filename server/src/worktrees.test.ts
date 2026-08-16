import { describe, expect, test } from 'bun:test';
import { parseWorktreePorcelain } from './worktrees';

const SINGLE_MAIN = `worktree /tmp/repo
HEAD 1a2b3c4d5e6f
branch refs/heads/main
`;

const MULTI = `worktree /tmp/repo
HEAD 1a2b3c4
branch refs/heads/main

worktree /tmp/repo-wt-1
HEAD 2b3c4d5
branch refs/heads/feature-x

worktree /tmp/repo-wt-2
HEAD 3c4d5e6
branch refs/heads/feature-y
`;

const DETACHED = `worktree /tmp/repo-wt
HEAD 4d5e6f7
detached
`;

const WINDOWS_PATHS = `worktree C:/dev/repo
HEAD 5e6f7a8
branch refs/heads/main

worktree C:/dev/repo-wt
HEAD 6f7a8b9
branch refs/heads/topic
`;

describe('parseWorktreePorcelain', () => {
  test('parses a single main worktree with a branch', () => {
    const result = parseWorktreePorcelain(SINGLE_MAIN);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      path: '/tmp/repo',
      branch: 'main',
      detached: false,
    });
  });

  test('parses multiple worktrees with their branches', () => {
    const result = parseWorktreePorcelain(MULTI);
    expect(result).toHaveLength(3);
    expect(result[0].path).toBe('/tmp/repo');
    expect(result[0].branch).toBe('main');
    expect(result[1].path).toBe('/tmp/repo-wt-1');
    expect(result[1].branch).toBe('feature-x');
    expect(result[2].path).toBe('/tmp/repo-wt-2');
    expect(result[2].branch).toBe('feature-y');
  });

  test('marks a detached HEAD worktree without a branch', () => {
    const result = parseWorktreePorcelain(DETACHED);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      path: '/tmp/repo-wt',
      branch: null,
      detached: true,
    });
  });

  test('handles Windows-style drive paths', () => {
    const result = parseWorktreePorcelain(WINDOWS_PATHS);
    expect(result[0].path).toBe('C:/dev/repo');
    expect(result[1].path).toBe('C:/dev/repo-wt');
    expect(result[1].branch).toBe('topic');
  });

  test('returns an empty array for empty input', () => {
    expect(parseWorktreePorcelain('')).toEqual([]);
  });

  test('ignores unknown porcelain lines within a block', () => {
    const input = `worktree /tmp/repo
HEAD aaaa
branch refs/heads/main
locked reason

worktree /tmp/other
HEAD bbbb
bare
`;
    const result = parseWorktreePorcelain(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      path: '/tmp/repo',
      branch: 'main',
      detached: false,
    });
  });
});
