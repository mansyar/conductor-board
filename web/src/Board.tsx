import { useCallback, useEffect, useState } from 'react';
import { COLUMN_CONFIG, COLUMN_ORDER } from './boardColumns';
import type { Board as BoardModel, TrackCard } from './types';

interface BoardProps {
  /** Active project id, or null when none selected. */
  activeId: number | null;
}

async function fetchFileText(worktree: string, path: string): Promise<string> {
  const params = new URLSearchParams({ worktree, path });
  const res = await fetch(`/api/file?${params.toString()}`);
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  return await res.text();
}

type ModalKind = 'spec' | 'plan';

interface ModalTarget {
  worktree: string;
  trackId: string;
  trackName: string;
  kind: ModalKind;
}

function FileModal({
  target,
  onClose,
}: {
  target: ModalTarget;
  onClose: () => void;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const text = await fetchFileText(
          target.worktree,
          `conductor/tracks/${target.trackId}/${target.kind}.md`,
        );
        if (!cancelled) {
          setContent(text);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load file');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [target]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-6"
      role="presentation"
    >
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-zinc-100">
              {target.kind === 'spec' ? 'Spec' : 'Plan'} · {target.trackName}
            </p>
            <p className="text-xs text-zinc-500">{target.trackId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            Close
          </button>
        </div>
        <div className="overflow-auto p-4">
          {error !== null ? (
            <p className="text-sm text-red-300">{error}</p>
          ) : content === null ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-300">
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  card: TrackCard;
  onOpen: (kind: ModalKind) => void;
  onCopy: () => void;
}

function TrackCardView({ card, onOpen, onCopy }: CardProps) {
  const columnColor =
    card.columnId === null ? '' : COLUMN_CONFIG[card.columnId].bar;
  const branch = card.detached ? 'detached' : card.branch;

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
      <p className="text-sm font-medium text-zinc-100">
        {card.trackName ?? card.worktreePath}
      </p>
      {card.trackId !== null && (
        <p className="mt-0.5 text-xs text-zinc-500">{card.trackId}</p>
      )}
      {card.notInitialized && (
        <p className="mt-1 text-xs text-amber-400">Not initialized</p>
      )}
      <p className="mt-1 truncate text-xs text-zinc-400">
        {card.worktreePath}
        {branch !== null && ` · ${branch}`}
      </p>
      {card.progress.total > 0 && (
        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded bg-zinc-800">
            <div
              className={`h-full ${columnColor}`}
              style={{ width: `${card.progress.pct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {card.progress.done}/{card.progress.total} · {card.progress.pct}%
          </p>
        </div>
      )}
      <div className="mt-2 flex gap-2 text-xs">
        {card.trackId !== null && (
          <>
            <button
              type="button"
              onClick={() => onOpen('spec')}
              className="text-zinc-400 hover:text-zinc-100"
            >
              Spec
            </button>
            <button
              type="button"
              onClick={() => onOpen('plan')}
              className="text-zinc-400 hover:text-zinc-100"
            >
              Plan
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onCopy}
          className="text-zinc-500 hover:text-zinc-100"
        >
          Copy path
        </button>
      </div>
    </div>
  );
}

export function Board({ activeId }: BoardProps) {
  const [board, setBoard] = useState<BoardModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalTarget | null>(null);

  const load = useCallback(async () => {
    if (activeId === null) {
      setBoard(null);
      setError(null);
      return;
    }
    try {
      const res = await fetch('/api/board');
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? `Request failed (${res.status})`);
        setBoard(null);
        return;
      }
      setBoard((await res.json()) as BoardModel);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
      setBoard(null);
    }
  }, [activeId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => {
      void load();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  async function copyPath(card: TrackCard) {
    try {
      await navigator.clipboard.writeText(card.worktreePath);
    } catch {
      // Clipboard unavailable; ignore.
    }
  }

  if (activeId === null || board === null) {
    return <p className="text-sm text-zinc-500">No project selected.</p>;
  }

  if (error !== null) {
    return (
      <div className="space-y-1">
        <p className="text-sm text-red-300">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm text-zinc-400 hover:text-zinc-100"
        >
          Retry
        </button>
      </div>
    );
  }

  const { done, total, pct } = board.progress;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          {done}/{total} tasks complete · {pct}%
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded border border-zinc-800 px-3 py-1 text-sm text-zinc-300 hover:border-zinc-600"
        >
          Refresh
        </button>
      </div>

      {board.cards.length === 0 && board.idle.length === 0 ? (
        <p className="text-sm text-zinc-500">No tracks yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMN_ORDER.map((columnId) => {
            const config = COLUMN_CONFIG[columnId];
            const cards = board.cards.filter((c) => c.columnId === columnId);
            return (
              <section key={columnId} className="space-y-2">
                <header className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                  <h2 className="text-sm font-medium text-zinc-100">
                    {config.label}
                  </h2>
                  <span className="text-xs text-zinc-500">{cards.length}</span>
                </header>
                <div className="space-y-2">
                  {cards.length === 0 ? (
                    <p className="text-xs text-zinc-600">Empty</p>
                  ) : (
                    cards.map((card) => (
                      <TrackCardView
                        key={`${card.worktreePath}-${card.trackId}`}
                        card={card}
                        onOpen={(kind) =>
                          setModal({
                            worktree: card.worktreePath,
                            trackId: card.trackId ?? '',
                            trackName: card.trackName ?? card.trackId ?? '',
                            kind,
                          })
                        }
                        onCopy={() => void copyPath(card)}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {board.idle.length > 0 && (
        <section className="space-y-2">
          <header className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-zinc-500" />
            <h2 className="text-sm font-medium text-zinc-300">Idle</h2>
            <span className="text-xs text-zinc-500">{board.idle.length}</span>
          </header>
          <div className="space-y-2">
            {board.idle.map((card) => (
              <TrackCardView
                key={`idle-${card.worktreePath}`}
                card={card}
                onOpen={() => undefined}
                onCopy={() => void copyPath(card)}
              />
            ))}
          </div>
        </section>
      )}

      {modal !== null && (
        <FileModal target={modal} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
