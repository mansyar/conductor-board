import { describe, expect, it } from 'bun:test';
import { filterCards } from './filterCards';
import type { TrackCard } from './types';

function card(overrides: Partial<TrackCard> = {}): TrackCard {
  return {
    worktreePath: '/repo/wt-alpha',
    branch: 'feature/alpha',
    detached: false,
    trackId: 't-alpha_20260817',
    trackName: 'Alpha feature',
    columnId: 'implement',
    progress: { done: 2, total: 4, pct: 50 },
    ...overrides,
  };
}

describe('filterCards', () => {
  it('returns all cards unchanged for an empty or whitespace query', () => {
    const cards = [card({ trackName: 'Alpha' }), card({ trackName: 'Beta' })];
    expect(filterCards(cards, '')).toEqual(cards);
    expect(filterCards(cards, '   ')).toEqual(cards);
  });

  it('matches track name case-insensitively', () => {
    const cards = [
      card({
        trackName: 'Alpha feature',
        trackId: 't-one',
        branch: 'main',
        worktreePath: '/repo/wt-one',
      }),
      card({
        trackName: 'Beta bug',
        trackId: 't-two',
        branch: 'main',
        worktreePath: '/repo/wt-two',
      }),
    ];
    const result = filterCards(cards, 'alpha');
    expect(result.map((c) => c.trackName)).toEqual(['Alpha feature']);
  });

  it('matches track id', () => {
    const cards = [
      card({ trackId: 'payments_20260902' }),
      card({ trackId: 'auth_20260902' }),
    ];
    const result = filterCards(cards, 'payments');
    expect(result.map((c) => c.trackId)).toEqual(['payments_20260902']);
  });

  it('matches worktree path', () => {
    const cards = [
      card({ worktreePath: '/repo/wt-payments' }),
      card({ worktreePath: '/repo/wt-auth' }),
    ];
    const result = filterCards(cards, 'wt-auth');
    expect(result.map((c) => c.worktreePath)).toEqual(['/repo/wt-auth']);
  });

  it('matches branch', () => {
    const cards = [
      card({ branch: 'feature/payments' }),
      card({ branch: 'fix/auth' }),
    ];
    const result = filterCards(cards, 'payments');
    expect(result.map((c) => c.branch)).toEqual(['feature/payments']);
  });

  it('handles null fields without throwing and matches via remaining text', () => {
    const cards = [card({ trackName: null, trackId: null, branch: null })];
    expect(filterCards(cards, 'wt-alpha')).toEqual(cards);
    expect(filterCards(cards, 'missing')).toEqual([]);
  });

  it('returns an empty array when nothing matches', () => {
    const cards = [card({ trackName: 'Alpha' })];
    expect(filterCards(cards, 'zzz-nope')).toEqual([]);
  });

  it('preserves the original order of matching cards', () => {
    const cards = [
      card({ trackName: 'Gamma' }),
      card({ trackName: 'Alpha' }),
      card({ trackName: 'Beta' }),
    ];
    expect(filterCards(cards, '').map((c) => c.trackName)).toEqual([
      'Gamma',
      'Alpha',
      'Beta',
    ]);
  });
});