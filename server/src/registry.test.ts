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

const TWO_LINE_ARCHIVE = `# Tracks Registry

## Complete

- [x] **Track: Old Feature**
      _Link: [./archive/old_20260101/](./archive/old_20260101/)_
`;

const TWO_LINE_INDEX = `# Tracks Registry

## Active

- [ ] **Track: Idea**
      _Link: [./tracks/idea_20260201/index.md](./tracks/idea_20260201/index.md)_
`;

describe('parseTracksRegistry: link on a following indented _Link: line', () => {
  test('resolves the id from an archive _Link line', () => {
    const [track] = parseTracksRegistry(TWO_LINE_ARCHIVE);
    expect(track).toBeDefined();
    expect(track.id).toBe('old_20260101');
    expect(track.description).toBe('Old Feature');
  });

  test('resolves the id from a _Link line pointing at a track index.md', () => {
    const [track] = parseTracksRegistry(TWO_LINE_INDEX);
    expect(track).toBeDefined();
    expect(track.id).toBe('idea_20260201');
  });
});

describe('trackIdFromLink: archive and trailing-slash link shapes', () => {
  test('resolves the id from an archived link target directory', () => {
    const md =
      '- [x] **Track: Old Feature** *Link: [./archive/old_20260101/](./archive/old_20260101/)*\n';
    const [track] = parseTracksRegistry(md);
    expect(track.id).toBe('old_20260101');
  });

  test('resolves the id from a trailing-slash link without index.md', () => {
    const md =
      '- [ ] **Track: Idea** *Link: [./tracks/idea_20260201/](./tracks/idea_20260201/)*\n';
    const [track] = parseTracksRegistry(md);
    expect(track.id).toBe('idea_20260201');
  });

  test('keeps resolving ids for the standard index.md shape', () => {
    const md =
      '- [ ] **Track: Idea** *Link: [./tracks/idea_20260201/index.md](./tracks/idea_20260201/index.md)*\n';
    const [track] = parseTracksRegistry(md);
    expect(track.id).toBe('idea_20260201');
  });
});
