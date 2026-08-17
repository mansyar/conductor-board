import type { PreferencesResponse } from './types';

/** Fetches the active project's expanded Complete-column months. */
export async function fetchPreferences(): Promise<PreferencesResponse> {
  const res = await fetch('/api/preferences');
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as PreferencesResponse;
}

/** Persists the active project's expanded Complete-column months. */
export async function savePreferences(
  expandedMonths: string[],
): Promise<PreferencesResponse> {
  const res = await fetch('/api/preferences', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ expandedMonths }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as PreferencesResponse;
}
