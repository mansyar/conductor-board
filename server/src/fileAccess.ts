import { isAbsolute, relative, resolve } from 'node:path';

/**
 * Resolves `requested` (a path relative to `root`) and returns the absolute
 * path only when it stays within `root`. Returns null on any escape attempt:
 * `..` traversal, an absolute path outside `root`, or a different drive.
 */
export function resolveWithin(root: string, requested: string): string | null {
  const target = resolve(root, requested);
  const rel = relative(root, target);
  if (rel === '') {
    return target;
  }
  if (rel.startsWith('..') || isAbsolute(rel)) {
    return null;
  }
  return target;
}
