import { useCallback, useEffect, useState } from 'react';
import { Board } from './Board';
import type { Project, ProjectsResponse } from './types';

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

  const refreshProjects = useCallback(async () => {
    try {
      const data = await fetchJson<ProjectsResponse>('/api/projects');
      setProjects(data.projects);
      setActiveId(data.activeId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    }
  }, []);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

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
      await refreshProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add project');
    }
  }

  async function removeProject(id: number) {
    await fetchJson<{ removed: boolean }>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
    await refreshProjects();
  }

  async function switchProject(id: number) {
    await fetchJson<{ activeId: number }>(`/api/projects/${id}/active`, {
      method: 'PUT',
    });
    await refreshProjects();
  }

  const activeProject = projects.find((p) => p.id === activeId);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-lg font-medium">Conductor Board</h1>
          <p className="text-sm text-zinc-500">
            {activeProject !== undefined
              ? activeProject.path
              : 'No project selected'}
          </p>
        </header>

        <section className="mb-8 space-y-3">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void addProject();
            }}
          >
            <input
              type="text"
              value={path}
              onChange={(event) => setPath(event.target.value)}
              placeholder="Add a git repo with conductor/…"
              className="min-w-0 flex-1 rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            />
            <button
              type="submit"
              className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
            >
              Add
            </button>
          </form>

          {error !== null && (
            <p className="rounded border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          {projects.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {projects.map((project) => (
                <li key={project.id}>
                  <div
                    className={`inline-flex max-w-80 items-center overflow-hidden rounded border ${
                      project.id === activeId
                        ? 'border-zinc-100'
                        : 'border-zinc-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => void switchProject(project.id)}
                      className={`min-w-0 flex-1 truncate px-3 py-1 text-left text-sm ${
                        project.id === activeId
                          ? 'text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                      title={project.path}
                    >
                      {project.path}
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${project.path}`}
                      onClick={() => void removeProject(project.id)}
                      className="px-2 py-1 text-sm text-zinc-600 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Board activeId={activeId} />
      </div>
    </main>
  );
}
