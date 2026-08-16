import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import {
  createLiveService,
  formatSse,
  type LiveService,
  type WatchHandle,
} from './liveUpdates';

function noopWatcher(): WatchHandle {
  return { close() {} };
}

describe('formatSse', () => {
  test('formats an event with the SSE wire shape', () => {
    expect(formatSse('board-changed', '{}')).toBe(
      'event: board-changed\ndata: {}\n\n',
    );
  });
});

describe('createLiveService', () => {
  test('broadcast delivers a formatted message to subscribed clients only', () => {
    const live: LiveService = createLiveService({
      async listWorktrees() {
        return [];
      },
      watch: noopWatcher,
    });
    const received: string[] = [];
    const unsubscribe = live.subscribe((message) => received.push(message));

    live.broadcast('board-changed', '{}');
    expect(received).toEqual(['event: board-changed\ndata: {}\n\n']);

    unsubscribe();
    live.broadcast('board-changed', '{}');
    expect(received).toHaveLength(1);
  });

  test('broadcast fans out to every connected client', () => {
    const live: LiveService = createLiveService({
      async listWorktrees() {
        return [];
      },
      watch: noopWatcher,
    });
    const first: string[] = [];
    const second: string[] = [];
    live.subscribe((message) => first.push(message));
    live.subscribe((message) => second.push(message));

    live.broadcast('board-changed', '{}');
    const expected = 'event: board-changed\ndata: {}\n\n';
    expect(first).toEqual([expected]);
    expect(second).toEqual([expected]);
  });

  test('setActiveProject watches each worktree conductor dir recursively', async () => {
    const watched: string[] = [];
    const live: LiveService = createLiveService({
      async listWorktrees() {
        return [{ path: '/repo/a' }, { path: '/repo/b' }];
      },
      watch(dir) {
        watched.push(dir);
        return noopWatcher();
      },
    });

    await live.setActiveProject('/repo');

    expect(watched).toEqual([
      join('/repo', 'a', 'conductor'),
      join('/repo', 'b', 'conductor'),
    ]);
  });

  test('a conductor change emits one debounced board-changed broadcast', async () => {
    let emitted = 0;
    let change: (() => void) | undefined;
    const live: LiveService = createLiveService({
      debounceWaitMs: 10,
      async listWorktrees() {
        return [{ path: '/repo/a' }];
      },
      watch(_dir, onEvent) {
        change = onEvent;
        return noopWatcher();
      },
    });
    live.subscribe(() => {
      emitted += 1;
    });

    await live.setActiveProject('/repo');
    expect(change).toBeDefined();
    change?.();
    change?.();

    expect(emitted).toBe(0);
    await delay(40);
    expect(emitted).toBe(1);
  });

  test('tolerates an unwatchable worktree conductor dir without throwing', async () => {
    const live: LiveService = createLiveService({
      async listWorktrees() {
        return [{ path: '/repo/a' }, { path: '/repo/b' }];
      },
      watch(dir) {
        if (dir === join('/repo', 'a', 'conductor')) {
          throw new Error('cannot watch');
        }
        return noopWatcher();
      },
    });

    await expect(live.setActiveProject('/repo')).resolves.toBeUndefined();
  });

  test('setActiveProject tolerates a listWorktrees failure without throwing', async () => {
    const live: LiveService = createLiveService({
      async listWorktrees() {
        throw new Error('boom');
      },
      watch: noopWatcher,
    });
    const sent: string[] = [];
    live.subscribe((message) => sent.push(message));

    await expect(
      live.setActiveProject('C:/some/broken/repo'),
    ).resolves.toBeUndefined();
    expect(sent).toEqual([]);
  });

  test('a superseded setActiveProject does not register stale watchers', async () => {
    const watchedDirs: string[] = [];
    let releaseFirst: () => void = () => {};
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const live: LiveService = createLiveService({
      debounceWaitMs: 10,
      async listWorktrees(projectPath) {
        if (projectPath === 'A') {
          await firstGate;
          return [{ path: 'A' }];
        }
        return [{ path: 'B' }];
      },
      watch(dir) {
        watchedDirs.push(dir);
        return { close() {} };
      },
    });

    const first = live.setActiveProject('A');
    await live.setActiveProject('B');
    releaseFirst();
    await first;

    expect(watchedDirs).toEqual([join('B', 'conductor')]);
  });

  test('setActiveProject(null) closes existing watchers', async () => {
    const closed: string[] = [];
    const live: LiveService = createLiveService({
      async listWorktrees() {
        return [{ path: '/repo/a' }];
      },
      watch(dir) {
        return {
          close() {
            closed.push(dir);
          },
        };
      },
    });

    await live.setActiveProject('/repo');
    await live.setActiveProject(null);

    expect(closed).toEqual([join('/repo', 'a', 'conductor')]);
  });

  test('close drops clients and watchers', async () => {
    const closed: string[] = [];
    const live: LiveService = createLiveService({
      async listWorktrees() {
        return [{ path: '/repo/a' }];
      },
      watch(dir) {
        return {
          close() {
            closed.push(dir);
          },
        };
      },
    });
    const received: string[] = [];
    live.subscribe((message) => received.push(message));

    await live.setActiveProject('/repo');
    live.close();

    expect(closed).toEqual([join('/repo', 'a', 'conductor')]);
    live.broadcast('board-changed', '{}');
    expect(received).toHaveLength(0);
  });
});
