import type { TrackCard } from './types';

/**
 * Keep only cards whose visible text (track name, track id, worktree path,
 * branch) contains the query as a case-insensitive substring. A blank or
 * whitespace-only query returns the input unchanged.
 */
export function filterCards(cards: TrackCard[], query: string): TrackCard[] {
  const q = query.trim().toLowerCase();
  if (q === '') {
    return cards;
  }
  return cards.filter((card) => {
    const haystack = [card.trackName, card.trackId, card.worktreePath, card.branch]
      .filter((v): v is string => v !== null)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}