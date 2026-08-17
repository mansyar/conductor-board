import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFsProjectReads } from './fsProjectReads';

describe('createFsProjectReads().listArchiveDirs', () => {
  test('lists archived track folders under conductor/archive', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cboard-archive-'));
    try {
      await mkdir(join(dir, 'conductor', 'archive', 'track-a'), {
        recursive: true,
      });
      await mkdir(join(dir, 'conductor', 'archive', 'track-b'), {
        recursive: true,
      });
      await writeFile(join(dir, 'conductor', 'archive', 'notes.txt'), 'x');

      const reads = createFsProjectReads();
      expect(await reads.listArchiveDirs(dir)).toEqual(['track-a', 'track-b']);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test('returns empty when conductor/archive does not exist', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cboard-noarchive-'));
    try {
      const reads = createFsProjectReads();
      expect(await reads.listArchiveDirs(dir)).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('createFsProjectReads().readMtimeMs', () => {
  test('returns the file mtime in epoch ms', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cboard-mtime-'));
    try {
      const target = join(dir, 'conductor', 'tracks', 't-1', 'plan.md');
      await mkdir(join(dir, 'conductor', 'tracks', 't-1'), {
        recursive: true,
      });
      await writeFile(target, '# Plan\n');
      const before = Date.now();

      const reads = createFsProjectReads();
      const mtime = await reads.readMtimeMs(
        dir,
        'conductor/tracks/t-1/plan.md',
      );

      expect(mtime).not.toBeNull();
      expect(mtime as number).toBeGreaterThanOrEqual(before - 5_000);
      expect(mtime as number).toBeLessThanOrEqual(Date.now() + 5_000);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test('returns null when the file does not exist', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cboard-nomtime-'));
    try {
      const reads = createFsProjectReads();
      expect(
        await reads.readMtimeMs(dir, 'conductor/tracks/nope/spec.md'),
      ).toBe(null);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
