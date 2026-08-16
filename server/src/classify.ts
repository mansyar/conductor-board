import type { CheckboxState } from './registry';

export type TrackPhase = 'spec-plan' | 'implement' | 'review' | 'complete';

/**
 * Maps a registry checkbox state plus archive membership to a lifecycle phase.
 * A track that has been archived (moved under conductor/archive/) is always
 * Complete; otherwise the phase follows the checkbox state.
 */
export function classifyPhase(
  state: CheckboxState,
  archived: boolean,
): TrackPhase {
  if (archived) {
    return 'complete';
  }
  switch (state) {
    case ' ':
      return 'spec-plan';
    case '~':
      return 'implement';
    case 'x':
      return 'review';
  }
}
