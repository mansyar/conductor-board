/**
 * Minimal shape of an SSE event source so tests can inject a fake instead of
 * the browser-native `EventSource`.
 */
export interface LiveEventSource {
  addEventListener(type: 'board-changed', listener: () => void): void;
  close(): void;
}

export type EventSourceFactory = (url: string) => LiveEventSource;

/**
 * Subscribes to `board-changed` events on an SSE stream. Resolves to an
 * unsubscribe function that closes the connection. The default factory uses
 * the browser's `EventSource`, which auto-reconnects on drops.
 */
export function subscribeLive(
  url: string,
  onBoardChanged: () => void,
  createSource: EventSourceFactory = (u) =>
    new EventSource(u) as unknown as LiveEventSource,
): () => void {
  const source = createSource(url);
  source.addEventListener('board-changed', onBoardChanged);
  return () => source.close();
}
