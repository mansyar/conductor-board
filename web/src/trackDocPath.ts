export type TrackDocKind = 'spec' | 'plan';

/** Resolves the spec/plan document path for a card's track. Archived tracks
 * live under conductor/archive/<id>/; active tracks under conductor/tracks/<id>/. */
export function trackDocPath(opts: {
  archived: boolean;
  trackId: string;
  kind: TrackDocKind;
}): string {
  const area = opts.archived ? 'archive' : 'tracks';
  return `conductor/${area}/${opts.trackId}/${opts.kind}.md`;
}
