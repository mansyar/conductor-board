import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { isRealPathWithin, resolveWithin } from './fileAccess';

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

describe('isRealPathWithin', () => {
  test('accepts a real path inside the root', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'board-root-'));
    try {
      await mkdir(join(dir, 'sub'));
      const inside = join(dir, 'sub', 'f.txt');
      await writeFile(inside, 'x');
      expect(await isRealPathWithin(dir, inside)).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test('rejects a real path outside the root', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'board-root-'));
    const outside = await mkdtemp(join(tmpdir(), 'board-out-'));
    try {
      const outsideFile = join(outside, 'secret.txt');
      await writeFile(outsideFile, 'x');
      expect(await isRealPathWithin(rootDir, outsideFile)).toBe(false);
    } finally {
      await rm(rootDir, { recursive: true, force: true });
      await rm(outside, { recursive: true, force: true });
    }
  });
});
