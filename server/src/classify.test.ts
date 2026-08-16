import { describe, expect, test } from 'bun:test';
import { classifyPhase } from './classify';

describe('classifyPhase', () => {
  test('maps unchecked [ ] to Spec & Plan', () => {
    expect(classifyPhase(' ', false)).toBe('spec-plan');
  });

  test('maps in-progress [~] to Implement', () => {
    expect(classifyPhase('~', false)).toBe('implement');
  });

  test('maps checked [x] still in tracks/ to Review', () => {
    expect(classifyPhase('x', false)).toBe('review');
  });

  test('maps an archived track to Complete regardless of checkbox state', () => {
    expect(classifyPhase('x', true)).toBe('complete');
    expect(classifyPhase(' ', true)).toBe('complete');
    expect(classifyPhase('~', true)).toBe('complete');
  });
});