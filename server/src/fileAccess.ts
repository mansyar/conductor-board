import { realpath } from 'node:fs/promises';
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

/**
 * Real-path containment check: returns true when `target`'s resolved real
 * path stays within `root`'s real path. Guards against symlinks inside the
 * tree that point outside it (which `resolveWithin`, being lexical, cannot
 * catch). Missing paths fall back to their lexical value. Uses `relative`
 * containment so it is robust across separator styles.
 */
export async function isRealPathWithin(
  root: string,
  target: string,
): Promise<boolean> {
  const [rootReal, targetReal] = await Promise.all([
    realpath(root).catch(() => root),
    realpath(target).catch(() => target),
  ]);
  const rel = relative(rootReal, targetReal);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}
