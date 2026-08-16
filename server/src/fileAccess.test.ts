import { describe, expect, test } from 'bun:test';
import { relative, resolve } from 'node:path';
import { resolveWithin } from './fileAccess';

const root = resolve('/w/main');

describe('resolveWithin', () => {
  test('resolves a file inside the root', () => {
    expect(resolveWithin(root, 'conductor/tracks/x/plan.md') ?? '').toBe(
      resolve(root, 'conductor/tracks/x/plan.md'),
    );
  });

  test('allows a nested subdirectory file', () => {
    const target = resolveWithin(
      root,
      'conductor/tracks/spec_20260101/spec.md',
    );
    expect(target).not.toBeNull();
    expect(relative(root, target ?? '')).toBe(
      relative(root, resolve(root, 'conductor/tracks/spec_20260101/spec.md')),
    );
  });

  test('rejects a single-directory escape', () => {
    expect(resolveWithin(root, '../secret')).toBeNull();
  });

  test('rejects a deep escape', () => {
    expect(resolveWithin(root, '../../etc/passwd')).toBeNull();
  });

  test('rejects an absolute path outside the root', () => {
    // Request a path that resolves to the parent of the root on any platform.
    const outside = resolve(root, '..');
    expect(resolveWithin(root, outside)).toBeNull();
  });

  test('allows a path equal to the root', () => {
    expect(resolveWithin(root, '')).toBe(resolve(root));
  });
});
