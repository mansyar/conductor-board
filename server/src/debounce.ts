/**
 * Returns a callable that, when invoked repeatedly within {@link waitMs},
 * defers running {@link fn} until the calls quiet down. Each call cancels the
 * previous timer, so a burst of events produces a single trailing invocation.
 */
export function createDebounce(waitMs: number, fn: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return () => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      fn();
    }, waitMs);
  };
}
