import { describe, expect, it } from 'bun:test';
import { trackDocPath } from './trackDocPath';

describe('trackDocPath', () => {
  it('resolves the archive path for archived tracks', () => {
    expect(
      trackDocPath({ archived: true, trackId: 'x_20260101', kind: 'spec' }),
    ).toBe('conductor/archive/x_20260101/spec.md');
  });

  it('resolves the tracks path for active tracks', () => {
    expect(
      trackDocPath({ archived: false, trackId: 'x_20260101', kind: 'plan' }),
    ).toBe('conductor/tracks/x_20260101/plan.md');
  });

  it('supports both document kinds', () => {
    expect(trackDocPath({ archived: true, trackId: 'x', kind: 'plan' })).toBe(
      'conductor/archive/x/plan.md',
    );
    expect(trackDocPath({ archived: false, trackId: 'x', kind: 'spec' })).toBe(
      'conductor/tracks/x/spec.md',
    );
  });
});
