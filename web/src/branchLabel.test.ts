import { describe, expect, test } from 'bun:test';
import { branchLabel } from './branchLabel';

describe('branchLabel', () => {
  test('renders a short sha for a detached worktree head', () => {
    expect(branchLabel(null, true, 'a1b2c3d4e5f67890')).toBe(
      'detached (a1b2c3d)',
    );
  });

  test('keeps an already-short sha unchanged', () => {
    expect(branchLabel(null, true, 'abc1234')).toBe('detached (abc1234)');
  });

  test('falls back to bare "detached" when no head sha is available', () => {
    expect(branchLabel(null, true, null)).toBe('detached');
    expect(branchLabel(null, true, undefined)).toBe('detached');
  });

  test('returns the branch name for a non-detached worktree', () => {
    expect(branchLabel('main', false, null)).toBe('main');
  });

  test('returns an empty string when non-detached and branch is null', () => {
    expect(branchLabel(null, false, null)).toBe('');
  });
});
