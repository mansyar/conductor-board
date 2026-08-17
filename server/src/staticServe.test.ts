import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { staticServeConfig } from './staticServe';

describe('staticServeConfig', () => {
  test('is disabled when no index.html exists', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cb-static-no-'));

    await mkdir(join(root, 'empty'), { recursive: true });
    const cfg = staticServeConfig(join(root, 'empty'));
    expect(cfg.enabled).toBe(false);
    expect(cfg.indexHtml).toBeNull();

    await rm(root, { recursive: true, force: true });
  });

  test('is enabled with the index.html path when the build exists', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cb-static-yes-'));
    await mkdir(join(root, 'dist'), { recursive: true });
    const indexPath = join(root, 'dist', 'index.html');
    await writeFile(indexPath, '<!doctype html><title>board</title>');

    const cfg = staticServeConfig(join(root, 'dist'));
    expect(cfg.enabled).toBe(true);
    expect(cfg.indexHtml).toBe(indexPath);

    await rm(root, { recursive: true, force: true });
  });
});