import { useCallback, useEffect, useState } from 'react';

interface Project {
  id: number;
  path: string;
  createdAt: string;
}

interface ProjectsResponse {
  projects: Project[];
  activeId: number | null;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [path, setPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchJson<ProjectsResponse>('/api/projects');
      setProjects(data.projects);
      setActiveId(data.activeId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function addProject() {
    if (path.trim() === '') {
      return;
    }
    try {
      await fetchJson<Project>('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: path.trim() }),
      });
      setPath('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add project');
    }
  }

  async function removeProject(id: number) {
    await fetchJson<{ removed: boolean }>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
    await refresh();
  }

  async function switchProject(id: number) {
    await fetchJson<{ activeId: number }>(`/api/projects/${id}/active`, {
      method: 'PUT',
    });
    await refresh();
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-lg font-medium">Conductor Board</h1>
          <p className="text-sm text-zinc-500">Projects</p>
        </header>

        <form
          className="mb-8 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void addProject();
          }}
        >
          <input
            type="text"
            value={path}
            onChange={(event) => setPath(event.target.value)}
            placeholder="Path to a git repo with conductor/"
            className="min-w-0 flex-1 rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          />
          <button
            type="submit"
            className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            Add project
          </button>
        </form>

        {error !== null && (
          <p className="mb-6 rounded border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-zinc-500">No projects yet.</p>
        ) : (
          <ul className="space-y-2">
            {projects.map((project) => (
              <li
                key={project.id}
                className="flex items-center justify-between gap-3 rounded border border-zinc-800 bg-zinc-900/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{project.path}</p>
                  {project.id === activeId && (
                    <p className="text-xs text-emerald-400">Active</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {project.id !== activeId && (
                    <button
                      type="button"
                      onClick={() => void switchProject(project.id)}
                      className="text-sm text-zinc-400 hover:text-zinc-100"
                    >
                      Set active
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void removeProject(project.id)}
                    className="text-sm text-zinc-500 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
