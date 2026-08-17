import type { HistoryResponse } from './types';

/** Fetches the active project's phase-history snapshots from the server. */
export async function fetchHistory(): Promise<HistoryResponse> {
  const res = await fetch('/api/history');
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as HistoryResponse;
}
