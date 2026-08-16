import { spawn } from 'node:child_process';

export interface ZedRunner {
  /**
   * Spawns `zed <path>` and resolves once the process has spawned. Rejects
   * when the spawn fails (most commonly because the `zed` binary is missing).
   */
  open(path: string): Promise<void>;
}

/**
 * Minimal shape of a child-process handle so tests can inject a fake `spawn`.
 * Only the events used by {@link createZedRunner} are required.
 */
type SpawnLike = (
  command: string,
  args: readonly string[],
) => {
  on(event: 'spawn', listener: () => void): unknown;
  on(event: 'error', listener: (error: unknown) => void): unknown;
};

/**
 * Default runner: fire-and-forget `zed <worktreePath>`, resolving when the
 * child has spawned so a missing binary (ENOENT) surfaces as a rejection.
 * `spawnFn` is injected by tests.
 */
export function createZedRunner(
  spawnFn: SpawnLike = spawn as unknown as SpawnLike,
): ZedRunner {
  return {
    open(path: string) {
      return new Promise<void>((resolve, reject) => {
        const child = spawnFn('zed', [path]);
        child.on('spawn', () => resolve());
        child.on('error', (error) =>
          reject(
            error instanceof Error
              ? error
              : new Error(`Could not launch Zed for "${path}"`),
          ),
        );
      });
    },
  };
}
