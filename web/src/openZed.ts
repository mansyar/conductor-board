/**
 * Asks the server to spawn `zed <worktreePath>`. Resolves on success; throws
 * with the server's message when the request fails (e.g. the `zed` CLI is not
 * on PATH).
 */
export async function openZed(worktreePath: string): Promise<void> {
  const res = await fetch('/api/open-zed', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path: worktreePath }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
}
