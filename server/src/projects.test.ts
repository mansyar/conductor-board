import { Database } from 'bun:sqlite';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrate } from './db';
import {
  createProjectRepository,
  isValidProjectPath,
  type ProjectRepository,
} from './projects';

let root: string;
let repo: ProjectRepository;

async function makeProject(
  name: string,
  opts: { git: boolean; conductor: boolean },
): Promise<string> {
  const dir = join(root, name);
  await mkdir(dir);
  if (opts.git) {
    await mkdir(join(dir, '.git'));
  }
  if (opts.conductor) {
    await mkdir(join(dir, 'conductor'));
  }
  return dir;
}

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'cb-projects-'));

  await makeProject('valid', { git: true, conductor: true });
  await makeProject('valid-a', { git: true, conductor: true });
  await makeProject('valid-b', { git: true, conductor: true });
  await makeProject('valid-c', { git: true, conductor: true });
  await makeProject('no-conductor', { git: true, conductor: false });
  await makeProject('not-git', { git: false, conductor: true });
  await writeFile(join(root, 'plain-file.txt'), 'not a directory');

  const db = new Database(':memory:');
  migrate(db);
  repo = createProjectRepository(db);
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('isValidProjectPath', () => {
  test('accepts a directory with .git and conductor/', async () => {
    expect(await isValidProjectPath(join(root, 'valid'))).toBe(true);
  });

  test('rejects a git repo without conductor/', async () => {
    expect(await isValidProjectPath(join(root, 'no-conductor'))).toBe(false);
  });

  test('rejects a path without .git', async () => {
    expect(await isValidProjectPath(join(root, 'not-git'))).toBe(false);
  });

  test('rejects a nonexistent path', async () => {
    expect(await isValidProjectPath(join(root, 'nope'))).toBe(false);
  });

  test('rejects a plain file', async () => {
    expect(await isValidProjectPath(join(root, 'plain-file.txt'))).toBe(false);
  });

  test('rejects an empty string', async () => {
    expect(await isValidProjectPath('   ')).toBe(false);
  });
});

describe('project repository CRUD', () => {
  test('add returns a project record', async () => {
    const project = await repo.add(join(root, 'valid'));
    expect(project.id).toBeGreaterThan(0);
    expect(project.path).toBe(join(root, 'valid'));
    expect(project.createdAt).toBeTruthy();
  });

  test('add rejects a path that is not a valid project', async () => {
    await expect(repo.add(join(root, 'no-conductor'))).rejects.toThrow(
      /git repo/,
    );
  });

  test('add rejects a duplicate path', async () => {
    await expect(repo.add(join(root, 'valid'))).rejects.toThrow();
  });

  test('list returns all added projects', () => {
    const projects = repo.list();
    expect(projects.some((p) => p.path === join(root, 'valid'))).toBe(true);
  });

  test('remove returns true and drops the project', async () => {
    const project = await repo.add(join(root, 'valid-c'));
    expect(repo.remove(project.id)).toBe(true);
    expect(repo.list().some((p) => p.id === project.id)).toBe(false);
  });

  test('remove returns false for a missing project', () => {
    expect(repo.remove(999_999)).toBe(false);
  });

  test('setActive stores the active project id', async () => {
    const project = await repo.add(join(root, 'valid-a'));
    repo.setActive(project.id);
    expect(repo.getActive()).toBe(project.id);
  });

  test('setActive throws for a missing project', () => {
    expect(() => repo.setActive(999_999)).toThrow();
  });

  test('remove clears the active project', async () => {
    const project = await repo.add(join(root, 'valid-b'));
    repo.setActive(project.id);
    repo.remove(project.id);
    expect(repo.getActive()).toBeNull();
  });
});
