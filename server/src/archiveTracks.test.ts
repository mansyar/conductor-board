import { describe, expect, it } from 'bun:test';
import { archivedTitle, dedupeArchived } from './archiveTracks';

describe('archivedTitle', () => {
  it('returns the metadata title when present and non-empty', () => {
    const json = JSON.stringify({
      id: 'x',
      title: 'Serve built frontend',
    });
    expect(archivedTitle('x', json)).toBe('Serve built frontend');
  });

  it('falls back to the folder id when title is missing', () => {
    const json = JSON.stringify({ track_id: 'x', status: 'complete' });
    expect(archivedTitle('x', json)).toBe('x');
  });

  it('falls back to the folder id when title is empty or whitespace', () => {
    expect(archivedTitle('x', JSON.stringify({ title: '' }))).toBe('x');
    expect(archivedTitle('x', JSON.stringify({ title: '   ' }))).toBe('x');
  });

  it('falls back to the folder id for malformed metadata', () => {
    expect(archivedTitle('x', 'not json')).toBe('x');
    expect(archivedTitle('x', '')).toBe('x');
  });
});

describe('dedupeArchived', () => {
  it('keeps the first card of duplicate archived trackIds', () => {
    const cards = [
      { trackId: 'a', archived: true },
      { trackId: 'a', archived: true },
      { trackId: 'b', archived: true },
    ];
    expect(dedupeArchived(cards)).toEqual([
      { trackId: 'a', archived: true },
      { trackId: 'b', archived: true },
    ]);
  });

  it('leaves non-archived cards untouched, including shared ids', () => {
    const cards = [
      { trackId: 'a', archived: false },
      { trackId: 'a', archived: true },
      { trackId: 'a', archived: false },
    ];
    expect(dedupeArchived(cards)).toEqual(cards);
  });

  it('returns a new array and preserves order', () => {
    const cards = [
      { trackId: 'b', archived: true },
      { trackId: 'b', archived: true },
      { trackId: 'a', archived: true },
    ];
    const result = dedupeArchived(cards);
    expect(result).not.toBe(cards);
    expect(result.map((c) => c.trackId)).toEqual(['b', 'a']);
  });
});
