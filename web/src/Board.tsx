import { useCallback, useEffect, useRef, useState } from 'react';
import { COLUMN_CONFIG, COLUMN_ORDER } from './boardColumns';
import { branchLabel } from './branchLabel';
import { groupCardsByMonth } from './completeMonths';
import { filterCards } from './filterCards';
import { fetchHistory } from './historyApi';
import { subscribeLive } from './liveSubscribe';
import { openZed } from './openZed';
import { fetchPreferences, savePreferences } from './preferencesApi';
import { relativeTime } from './relativeTime';
import { renderMarkdown } from './renderMarkdown';
import { sparklinePoints } from './sparkline';
import { trackDocPath } from './trackDocPath';
import { trendDelta } from './trend';
import type { Board as BoardModel, HistoryResponse, TrackCard } from './types';

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
  archived: boolean;
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
          trackDocPath({
            archived: target.archived,
            trackId: target.trackId,
            kind: target.kind,
          }),
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
            <div
              className="markdown-body text-sm leading-relaxed text-zinc-300"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: html sanitized by DOMPurify inside renderMarkdown
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
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
  onOpenZed: () => void;
}

function TrackCardView({ card, onOpen, onCopy, onOpenZed }: CardProps) {
  const columnColor =
    card.columnId === null ? '' : COLUMN_CONFIG[card.columnId].bar;
  const branch = branchLabel(card.branch, card.detached, card.headSha);

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
      <p className="text-sm font-medium text-zinc-100">
        {card.trackName ?? card.worktreePath}
      </p>
      {card.trackId !== null && (
        <p className="mt-0.5 text-xs text-zinc-500">{card.trackId}</p>
      )}
      {branch !== '' && (
        <span className="mt-2 inline-block max-w-full truncate rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-300">
          {branch}
        </span>
      )}
      {card.notInitialized && (
        <p className="mt-1 text-xs text-amber-400">Not initialized</p>
      )}
      <p className="mt-1 truncate text-xs text-zinc-500">{card.worktreePath}</p>
      {card.lastModifiedMs !== null && (
        <p className="mt-0.5 text-xs text-zinc-600">
          Modified {relativeTime(card.lastModifiedMs)}
        </p>
      )}
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
        <button
          type="button"
          onClick={onOpenZed}
          className="text-zinc-500 hover:text-zinc-100"
        >
          Open in Zed
        </button>
      </div>
    </div>
  );
}

export function Board({ activeId }: BoardProps) {
  const [board, setBoard] = useState<BoardModel | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalTarget | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const toastTimer = useRef<number | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await fetchHistory());
    } catch {
      setHistory(null);
    }
  }, []);

  const load = useCallback(async () => {
    if (activeId === null) {
      setBoard(null);
      setHistory(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
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
      void loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
      setBoard(null);
    } finally {
      setLoading(false);
    }
  }, [activeId, loadHistory]);

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

  // Live updates: re-fetch the board whenever the server broadcasts that a
  // conductor file changed. Closes the stream on unmount or project switch.
  useEffect(() => {
    if (activeId === null) {
      return;
    }
    return subscribeLive('/api/events', () => {
      void load();
    });
  }, [activeId, load]);

  // Load the persisted expanded-month preference whenever the active project
  // changes. Reset immediately so the previous project's state never leaks
  // into the new one; failures fall back to the default (all months collapsed).
  useEffect(() => {
    setExpandedMonths(new Set());
    if (activeId === null) {
      return;
    }
    let cancelled = false;
    void fetchPreferences()
      .then((prefs) => {
        if (!cancelled) {
          setExpandedMonths(new Set(prefs.expandedMonths));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setExpandedMonths(new Set());
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  /** Toggles a month section and persists the new expanded set. */
  function toggleMonth(key: string) {
    const next = new Set(expandedMonths);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setExpandedMonths(next);
    // A failed save keeps the local toggle; the preference simply resets on
    // the next load, so the UI stays responsive.
    void savePreferences([...next]).catch(() => {
      // Ignore persistence failures.
    });
  }

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current !== null) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(null), 5000);
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current !== null) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  async function copyPath(card: TrackCard) {
    try {
      await navigator.clipboard.writeText(card.worktreePath);
    } catch {
      // Clipboard unavailable; ignore.
    }
  }

  async function openInZed(card: TrackCard) {
    try {
      await openZed(card.worktreePath);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not launch Zed');
    }
  }

  if (activeId === null) {
    return <p className="text-sm text-zinc-500">No project selected.</p>;
  }

  if (loading && board === null) {
    return <p className="text-sm text-zinc-500">Loading board…</p>;
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

  if (board === null) {
    return null;
  }

  const { done, total, pct } = board.progress;
  const filterActive = filter.trim() !== '';
  const historySnapshots = history?.snapshots ?? [];
  const trendVisible = historySnapshots.length >= 2;
  const trend = trendVisible
    ? trendDelta(historySnapshots.map((snapshot) => snapshot.pct))
    : null;
  const sparkline = trendVisible
    ? sparklinePoints(
        historySnapshots.map((snapshot) => snapshot.pct),
        120,
        32,
      )
    : '';

  const idleCards = board.idle;
  const idleVisible = filterActive ? filterCards(idleCards, filter) : idleCards;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-zinc-400">
            {done}/{total} tasks complete · {pct}%
          </p>
          {trend !== null && (
            <span className="flex items-center gap-2 text-xs text-zinc-500">
              <svg
                className="text-zinc-400"
                width="120"
                height="32"
                viewBox="0 0 120 32"
                aria-hidden="true"
              >
                <polyline
                  points={sparkline}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <span>
                {historySnapshots.length} snapshots ·{' '}
                {trend.delta > 0 ? '+' : ''}
                {Math.round(trend.delta)}%
              </span>
            </span>
          )}
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter cards…"
            aria-label="Filter cards"
            className="w-48 rounded border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
        </div>
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
            const columnCards = board.cards.filter(
              (c) => c.columnId === columnId,
            );
            const cards = filterActive
              ? filterCards(columnCards, filter)
              : columnCards;
            const empty = cards.length === 0;
            const searchedAway = empty && columnCards.length > 0;
            // The Complete column groups into collapsible month sections unless
            // a filter is active (then a flat match list is clearer).
            const completeGroups =
              columnId === 'complete' && !filterActive
                ? groupCardsByMonth(cards)
                : null;
            return (
              <section key={columnId} className="space-y-2">
                <header className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                  <h2 className="text-sm font-medium text-zinc-100">
                    {config.label}
                  </h2>
                  <span className="text-xs text-zinc-500">
                    {columnCards.length}
                  </span>
                </header>
                <div className="space-y-2">
                  {completeGroups !== null ? (
                    completeGroups.length === 0 ? (
                      <p className="text-xs text-zinc-600">Empty</p>
                    ) : (
                      <div className="space-y-3">
                        {completeGroups.map((group) => {
                          const isExpanded = expandedMonths.has(group.key);
                          return (
                            <div key={group.key} className="space-y-2">
                              <button
                                type="button"
                                onClick={() => toggleMonth(group.key)}
                                aria-expanded={isExpanded}
                                className="sticky top-0 z-10 flex w-full items-center gap-2 rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-left hover:border-zinc-600"
                              >
                                <span className="text-xs text-zinc-500">
                                  {isExpanded ? '▾' : '▸'}
                                </span>
                                <span className="text-sm font-medium text-zinc-200">
                                  {group.label}
                                </span>
                                <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
                                  {group.cards.length}
                                </span>
                              </button>
                              {isExpanded && (
                                <div className="space-y-2">
                                  {group.cards.map((card) => (
                                    <TrackCardView
                                      key={`${card.worktreePath}-${card.trackId}`}
                                      card={card}
                                      onOpen={(kind) =>
                                        setModal({
                                          worktree: card.worktreePath,
                                          trackId: card.trackId ?? '',
                                          trackName:
                                            card.trackName ??
                                            card.trackId ??
                                            '',
                                          archived: card.archived ?? false,
                                          kind,
                                        })
                                      }
                                      onCopy={() => void copyPath(card)}
                                      onOpenZed={() => void openInZed(card)}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : empty ? (
                    <p className="text-xs text-zinc-600">
                      {searchedAway ? 'No matches' : 'Empty'}
                    </p>
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
                            archived: card.archived ?? false,
                            kind,
                          })
                        }
                        onCopy={() => void copyPath(card)}
                        onOpenZed={() => void openInZed(card)}
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
            {idleVisible.length === 0 ? (
              <p className="text-xs text-zinc-600">No matches</p>
            ) : (
              idleVisible.map((card) => (
                <TrackCardView
                  key={`idle-${card.worktreePath}`}
                  card={card}
                  onOpen={() => undefined}
                  onCopy={() => void copyPath(card)}
                  onOpenZed={() => void openInZed(card)}
                />
              ))
            )}
          </div>
        </section>
      )}

      {modal !== null && (
        <FileModal target={modal} onClose={() => setModal(null)} />
      )}

      {toast !== null && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-md border border-red-900/60 bg-zinc-950 px-4 py-3 text-sm text-red-300 shadow-lg"
        >
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="shrink-0 text-zinc-500 hover:text-zinc-200"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
