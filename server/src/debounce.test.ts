import { describe, expect, test } from 'bun:test';
import { setTimeout as delay } from 'node:timers/promises';
import { createDebounce } from './debounce';

describe('createDebounce', () => {
  test('defers invocation until calls quiet down within the window', async () => {
    let calls = 0;
    const debounced = createDebounce(30, () => {
      calls += 1;
    });

    debounced();
    debounced();
    debounced();

    expect(calls).toBe(0);
    await delay(80);
    expect(calls).toBe(1);
  });

  test('a trailing call after the window flushes once more', async () => {
    let calls = 0;
    const debounced = createDebounce(30, () => {
      calls += 1;
    });

    debounced();
    await delay(80);
    expect(calls).toBe(1);

    debounced();
    await delay(80);
    expect(calls).toBe(2);
  });
});
