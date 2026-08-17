import { describe, expect, test } from 'bun:test';
import { openDatabase } from './db';
import { createPreferencesRepository } from './preferences';

describe('preferences repository', () => {
  test('returns an empty list by default', () => {
    const db = openDatabase(':memory:');
    const repo = createPreferencesRepository(db);
    expect(repo.getExpandedMonths(1)).toEqual([]);
  });

  test('stores and returns expanded months', () => {
    const db = openDatabase(':memory:');
    const repo = createPreferencesRepository(db);
    repo.setExpandedMonths(1, ['2026-08']);
    expect(repo.getExpandedMonths(1)).toEqual(['2026-08']);
  });

  test('scopes expanded months by project', () => {
    const db = openDatabase(':memory:');
    const repo = createPreferencesRepository(db);
    repo.setExpandedMonths(1, ['2026-08']);
    repo.setExpandedMonths(2, ['2026-07']);
    expect(repo.getExpandedMonths(1)).toEqual(['2026-08']);
    expect(repo.getExpandedMonths(2)).toEqual(['2026-07']);
  });

  test('overwrites an existing preference', () => {
    const db = openDatabase(':memory:');
    const repo = createPreferencesRepository(db);
    repo.setExpandedMonths(1, ['2026-08']);
    repo.setExpandedMonths(1, ['2026-09']);
    expect(repo.getExpandedMonths(1)).toEqual(['2026-09']);
  });

  test('returns an empty list for malformed stored JSON', () => {
    const db = openDatabase(':memory:');
    db.query('INSERT INTO settings (key, value) VALUES (?, ?)').run(
      'complete_expanded_months:1',
      'not-json',
    );
    const repo = createPreferencesRepository(db);
    expect(repo.getExpandedMonths(1)).toEqual([]);
  });
});
