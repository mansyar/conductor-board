import { describe, expect, test } from 'bun:test';
import { relativeTime } from './relativeTime';

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

describe('relativeTime', () => {
  test('renders "just now" within the first minute', () => {
    expect(relativeTime(Date.now() - 5_000)).toBe('just now');
    expect(relativeTime(Date.now() - 59_000)).toBe('just now');
  });

  test('renders minutes ago', () => {
    expect(relativeTime(Date.now() - 2 * MINUTE)).toBe('2m ago');
    expect(relativeTime(Date.now() - 59 * MINUTE)).toBe('59m ago');
  });

  test('renders hours ago', () => {
    expect(relativeTime(Date.now() - 2 * HOUR)).toBe('2h ago');
    expect(relativeTime(Date.now() - 23 * HOUR)).toBe('23h ago');
  });

  test('renders days ago', () => {
    expect(relativeTime(Date.now() - 3 * DAY)).toBe('3d ago');
    expect(relativeTime(Date.now() - 30 * DAY)).toBe('30d ago');
  });
});
