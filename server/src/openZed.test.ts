import { describe, expect, test } from 'bun:test';
import { createZedRunner } from './openZed';

interface FakeChild {
  on(event: string, listener: (value?: unknown) => void): FakeChild;
  emitSpawn(): void;
  emitError(error: Error): void;
  command: string;
  args: readonly string[];
}

function fakeSpawn(): FakeChild {
  const listeners: Record<string, (value?: unknown) => void> = {};
  const child = {
    command: '',
    args: [] as readonly string[],
    on(event: string, listener: (value?: unknown) => void) {
      listeners[event] = listener;
      return child;
    },
    emitSpawn() {
      listeners.spawn?.();
    },
    emitError(error: Error) {
      listeners.error?.(error);
    },
  };
  return child;
}

describe('createZedRunner', () => {
  test('spawns `zed <path>` and resolves once the process spawns', async () => {
    const child = fakeSpawn();
    const spawnFn = (command: string, args: readonly string[]) => {
      child.command = command;
      child.args = args;
      return child;
    };
    const runner = createZedRunner(spawnFn);

    const pending = runner.open('/worktrees/alpha');
    child.emitSpawn();
    await pending;

    expect(child.command).toBe('zed');
    expect(child.args).toEqual(['/worktrees/alpha']);
  });

  test('rejects when the process fails to spawn (missing binary)', async () => {
    const child = fakeSpawn();
    const runner = createZedRunner(() => child);

    const pending = runner.open('/worktrees/alpha');
    child.emitError(
      Object.assign(new Error('spawn zed ENOENT'), { code: 'ENOENT' }),
    );
    await expect(pending).rejects.toThrow(/ENOENT/);
  });
});
