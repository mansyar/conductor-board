import { join } from 'node:path';
import { createDebounce } from './debounce';

/** A handle for an active directory watcher. */
export interface WatchHandle {
  close(): void;
}

/** Worktree shape required by the watcher; other fields are ignored. */
export interface WatchedWorktree {
  path: string;
}

/**
 * Server-side live-update hub. Tracks connected SSE clients and watches the
 * active project's worktree `conductor/` directories, broadcasting a
 * `board-changed` event (debounced) whenever a conductor file changes.
 */
export interface LiveService {
  /** Attach a connected SSE client; returns an unsubscribe function. */
  subscribe(send: (message: string) => void): () => void;
  /** (Re)point watchers at a project's worktrees, or stop watching on null. */
  setActiveProject(projectPath: string | null): Promise<void>;
  /** Broadcast a formatted SSE message to all connected clients. */
  broadcast(event: string, data: string): void;
  /** Tear down all watchers and drop all clients. */
  close(): void;
}

export interface LiveServiceDeps {
  listWorktrees(projectPath: string): Promise<WatchedWorktree[]>;
  /**
   * Begin a recursive watch of a directory, invoking {@link onEvent} on any
   * change. Throws when the directory cannot be watched (e.g. it is missing)
   * so callers can skip it gracefully.
   */
  watch(dir: string, onEvent: () => void): WatchHandle;
  debounceWaitMs?: number;
}

/** Formats a Server-Sent Event as wire text (one event + data field). */
export function formatSse(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

export function createLiveService(deps: LiveServiceDeps): LiveService {
  const waitMs = deps.debounceWaitMs ?? 500;
  const clients = new Set<(message: string) => void>();
  let watchers: WatchHandle[] = [];
  let activeRequest = 0;

  /** Fan a formatted message out to every connected client. */
  function broadcast(event: string, data: string): void {
    const message = formatSse(event, data);
    for (const send of clients) {
      send(message);
    }
  }

  function stopWatchers(): void {
    for (const handle of watchers) {
      try {
        handle.close();
      } catch {
        // Closing a watcher must never throw out of the service.
      }
    }
    watchers = [];
  }

  return {
    subscribe(send) {
      clients.add(send);
      return () => {
        clients.delete(send);
      };
    },

    async setActiveProject(projectPath) {
      const request = ++activeRequest;
      stopWatchers();
      if (projectPath === null) {
        return;
      }

      const broadcastChanged = createDebounce(waitMs, () =>
        broadcast('board-changed', '{}'),
      );
      let worktrees: WatchedWorktree[];
      try {
        worktrees = await deps.listWorktrees(projectPath);
      } catch {
        // A project whose worktrees cannot be listed must not crash the
        // server; it simply gets no live updates.
        return;
      }
      // A newer switch may have run while we awaited; drop our stale result.
      if (request !== activeRequest) {
        return;
      }
      for (const worktree of worktrees) {
        try {
          const handle = deps.watch(
            join(worktree.path, 'conductor'),
            broadcastChanged,
          );
          watchers.push(handle);
        } catch {
          // Unwatchable/missing conductor dir: skip it without failing the set.
        }
      }
    },

    broadcast,

    close() {
      stopWatchers();
      clients.clear();
    },
  };
}
