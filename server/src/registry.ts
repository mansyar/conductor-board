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
/** Matches an indented `_Link: [label](target)` line that follows a track line. */
const LINK_LINE_PATTERN = /^\s*\*?_?Link:\s*\[[^\]]*\]\(([^)]+)\)/;

function trackIdFromLink(link: string): string {
  const segments = link
    .replace(/\\/g, '/')
    .split('/')
    .filter((s) => s !== '' && s !== '.');
  if (segments.length === 0) {
    return '';
  }
  // Drop a trailing index file so the id resolves to the containing
  // directory, and handle archive/ links that end with a trailing slash.
  if (segments[segments.length - 1] === 'index.md') {
    segments.pop();
    if (segments.length === 0) {
      return '';
    }
  }
  return segments[segments.length - 1];
}

/**
 * Parses conductor/tracks.md into track entries. Matches the registry line
 * shape `- [state] **Track: <description>** *Link: [<path>](<link>)*`, ignoring
 * headings, blank lines, and any other non-track content.
 */
export function parseTracksRegistry(markdown: string): TrackEntry[] {
  const entries: TrackEntry[] = [];
  const lines = markdown.split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const lineMatch = rawLine.match(LINE_PATTERN);
    if (lineMatch === null) {
      continue;
    }

    const state = lineMatch[1] as CheckboxState;
    const description = lineMatch[2].trim();

    // The link may be inline on the track line (older single-line format) or
    // on a following indented `_Link:` line (as in conductor-board's own
    // tracks.md and most real registries).
    let link = '';
    const inline = rawLine.match(LINK_PATTERN);
    if (inline !== null) {
      link = inline[1];
    } else {
      const next = lines[i + 1];
      if (next !== undefined) {
        const linkLine = next.match(LINK_LINE_PATTERN);
        if (linkLine !== null) {
          link = linkLine[1];
          i += 1;
        }
      }
    }

    entries.push({
      state,
      id: trackIdFromLink(link),
      description,
      link,
    });
  }

  return entries;
}
