import { describe, expect, test } from 'bun:test';
import { parseTracksRegistry } from './registry';

const SINGLE = `# Tracks Registry

## Active

- [~] **Track: Conductor Board (MVP)** *Link: [tracks/board-mvp_20260816/index.md](./tracks/board-mvp_20260816/index.md)*
`;

const MULTI = `# Tracks Registry

## Active

- [~] **Track: Conductor Board (MVP)** *Link: [tracks/board-mvp_20260816/index.md](./tracks/board-mvp_20260816/index.md)*

## Complete

- [x] **Track: Old Feature** *Link: [tracks/old_20260101/index.md](./tracks/old_20260101/index.md)*

## Backlog

- [ ] **Track: Future Idea** *Link: [tracks/future_20260201/index.md](./tracks/future_20260201/index.md)*
`;

describe('parseTracksRegistry', () => {
  test('parses a single active track', () => {
    const result = parseTracksRegistry(SINGLE);
    expect(result).toHaveLength(1);
    expect(result[0].state).toBe('~');
    expect(result[0].id).toBe('board-mvp_20260816');
    expect(result[0].description).toBe('Conductor Board (MVP)');
  });

  test('parses multiple tracks with distinct checkbox states', () => {
    const result = parseTracksRegistry(MULTI);
    expect(result).toHaveLength(3);

    const byState: Record<string, string> = {};
    for (const track of result) {
      byState[track.state] = track.description;
    }
    expect(byState[' ']).toBe('Future Idea');
    expect(byState['~']).toBe('Conductor Board (MVP)');
    expect(byState.x).toBe('Old Feature');
  });

  test('extracts the track id from the link directory', () => {
    const [track] = parseTracksRegistry(SINGLE);
    expect(track.id).toBe('board-mvp_20260816');
  });

  test('ignores headings and non-track lines', () => {
    const result = parseTracksRegistry(MULTI);
    expect(result.every((track) => track.description.length > 0)).toBe(true);
  });

  test('returns an empty array for empty input', () => {
    expect(parseTracksRegistry('')).toEqual([]);
  });
});
