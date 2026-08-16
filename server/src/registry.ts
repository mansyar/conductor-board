export type CheckboxState = ' ' | '~' | 'x';

export interface TrackEntry {
  /** Raw checkbox character from the registry: ' ', '~', or 'x'. */
  state: CheckboxState;
  /** Track id derived from the link directory (e.g. board-mvp_20260816). */
  id: string;
  /** Track human-readable description (text after "Track:"). */
  description: string;
  /** Index file link target as written in the registry. */
  link: string;
}

const LINE_PATTERN = /^\s*-\s*\[([ ~x])\]\s*\*\*Track:\s*(.+?)\*\*/;
const LINK_PATTERN = /\[[^\]]*\]\(([^)]+)\)/;

function trackIdFromLink(link: string): string {
  const segments = link
    .replace(/\\/g, '/')
    .split('/')
    .filter((s) => s !== '');
  return segments.length >= 2 ? segments[segments.length - 2] : '';
}

/**
 * Parses conductor/tracks.md into track entries. Matches the registry line
 * shape `- [state] **Track: <description>** *Link: [<path>](<link>)*`, ignoring
 * headings, blank lines, and any other non-track content.
 */
export function parseTracksRegistry(markdown: string): TrackEntry[] {
  const entries: TrackEntry[] = [];

  for (const rawLine of markdown.split('\n')) {
    const lineMatch = rawLine.match(LINE_PATTERN);
    if (lineMatch === null) {
      continue;
    }

    const state = lineMatch[1] as CheckboxState;
    const description = lineMatch[2].trim();
    const linkMatch = rawLine.match(LINK_PATTERN);
    const link = linkMatch === null ? '' : linkMatch[1];

    entries.push({
      state,
      id: trackIdFromLink(link),
      description,
      link,
    });
  }

  return entries;
}
