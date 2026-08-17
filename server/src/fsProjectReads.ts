import { execFile } from 'node:child_process';
import { access, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { ProjectReads } from './boardService';
import { parseWorktreePorcelain } from './worktrees';

const execFileAsync = promisify(execFile);

/**
 * Production ProjectReads backed by git subprocess calls and the file system.
 */
export function createFsProjectReads(): ProjectReads {
  return {
    async listWorktrees(projectPath: string) {
      try {
        const { stdout } = (await execFileAsync('git', [
          '-C',
          projectPath,
          'worktree',
          'list',
          '--porcelain',
        ])) as { stdout: string };
        return parseWorktreePorcelain(stdout);
      } catch {
        return [];
      }
    },

    async readTextFile(worktreePath: string, relativePath: string) {
      return await readFile(join(worktreePath, relativePath), 'utf-8');
    },

    async isArchived(worktreePath: string, trackId: string) {
      try {
        await access(join(worktreePath, 'conductor', 'archive', trackId));
        return true;
      } catch {
        return false;
      }
    },

    async listArchiveDirs(worktreePath: string) {
      try {
        const entries = await readdir(
          join(worktreePath, 'conductor', 'archive'),
          { withFileTypes: true },
        );
        return entries.filter((e) => e.isDirectory()).map((e) => e.name);
      } catch {
        return [];
      }
    },
  };
}
