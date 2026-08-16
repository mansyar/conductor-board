import { describe, expect, test } from 'bun:test';
import { type LiveEventSource, subscribeLive } from './liveSubscribe';

interface FakeSource extends LiveEventSource {
  closed: number;
  listeners: Record<string, () => void>;
}

function fakeSource(listeners: Record<string, () => void>): FakeSource {
  return {
    closed: 0,
    listeners,
    addEventListener(type, listener) {
      listeners[type] = listener;
    },
    close() {
      this.closed += 1;
    },
  };
}

describe('subscribeLive', () => {
  test('fires onBoardChanged on a board-changed event', () => {
    const listeners: Record<string, () => void> = {};
    const source = fakeSource(listeners);
    let changed = 0;

    subscribeLive(
      '/api/events',
      () => {
        changed += 1;
      },
      () => source,
    );

    expect(listeners['board-changed']).toBeDefined();
    listeners['board-changed']();
    expect(changed).toBe(1);
  });

  test('registers exactly one listener for the source', () => {
    const listeners: Record<string, () => void> = {};
    const source = fakeSource(listeners);

    subscribeLive(
      '/api/events',
      () => {},
      () => source,
    );
    subscribeLive(
      '/api/events',
      () => {},
      () => source,
    );

    expect(Object.keys(listeners)).toHaveLength(1);
  });

  test('the returned function closes the source on unsubscribe', () => {
    const listeners: Record<string, () => void> = {};
    const source = fakeSource(listeners);

    const unsubscribe = subscribeLive(
      '/api/events',
      () => {},
      () => source,
    );
    expect(source.closed).toBe(0);
    unsubscribe();
    expect(source.closed).toBe(1);
  });
});
