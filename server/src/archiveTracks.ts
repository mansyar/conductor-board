/**
 * Shared shape for cards that can be deduplicated by archived-track id.
 */
export interface ArchivedCardLike {
  trackId: string | null;
  archived?: boolean;
}

/**
 * Best-effort title for an archived track: the `title` field from its
 * metadata.json when present and non-empty, otherwise the archive folder id.
 * Malformed or missing metadata falls back to the folder id.
 */
export function archivedTitle(id: string, metadataJson: string): string {
  try {
    const meta = JSON.parse(metadataJson) as Record<string, unknown>;
    if (typeof meta.title === 'string' && meta.title.trim() !== '') {
      return meta.title;
    }
  } catch {
    // Fall through to the folder id.
  }
  return id;
}

/**
 * Returns a new array with duplicate archived cards collapsed to the first
 * occurrence per archived trackId. Non-archived (active) cards are untouched,
 * including cards that happen to share an id across worktrees.
 */
export function dedupeArchived<T extends ArchivedCardLike>(cards: T[]): T[] {
  const seen = new Set<string>();
  return cards.filter((card) => {
    if (!card.archived || card.trackId === null) {
      return true;
    }
    if (seen.has(card.trackId)) {
      return false;
    }
    seen.add(card.trackId);
    return true;
  });
}
