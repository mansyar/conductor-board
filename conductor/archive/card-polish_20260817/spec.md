# Spec — Detached-HEAD + card polish + default port 3002

## Overview

Improves how the board's cards present branch/worktree identity and recency, and
frees port **3001** (reserved for the user's e2e tests) by moving the default
dev/serve port to **3002**.

| Today | Gap |
|---|---|
| Detached-HEAD renders a bare `detached`, though `git worktree list --porcelain` emits a `HEAD <sha>` line the parser ignores | Show `detached (<short-sha>)` |
| Worktree + branch share one muted line; branch gets no distinction | Render branch as a distinct badge on its own line; demote path to a quieter subtitle |
| No indication of how recently a track was touched | Show "last modified" (newest conductor-file mtime) as relative time |
| Server default port `3001` | Move default to `3002` (PORT env var still overrides) |

## Functional Requirements

### FR-1 — Default port 3002
- `server/src/index.ts` default becomes `process.env.PORT ?? 3002`.
- `web/vite.config.ts` `/api` proxy target becomes `http://localhost:3002`.
- The `PORT` environment variable still overrides the default (unchanged), so
  tests/CI can bind any port.

### FR-2 — Detached-HEAD short SHA
- `parseWorktreePorcelain` parses the `HEAD <sha>` line of each porcelain block
  and records the commit sha on the worktree when detached.
- The card model carries the detached HEAD sha; the UI renders
  `detached (<short-sha>)` (7-char prefix, e.g. `a1b2c3d`).
- Non-detached worktrees are unaffected.

### FR-3 — Branch badge layout
- Each card shows the branch (short name), or `detached (<short-sha>)`, as a
  distinct badge on its own line, visually separated from the worktree path.
- The worktree path becomes a quieter subtitle below/next to the track name.
- Applied to active-track cards and idle-lane cards alike.

### FR-4 — Last-modified (relative time)
- The server computes, per card, `lastModified` = the **newest mtime** across the
  track's own conductor files in its directory:
  - Active track: `conductor/tracks/<id>/{spec.md,plan.md,metadata.json}`
    (whichever exist).
  - Archived card: `conductor/archive/<id>/{spec.md,plan.md,metadata.json}`.
- Exposed as an epoch-ms timestamp and formatted client-side as relative time
  (e.g. `just now`, `2h ago`, `3d ago`).
- A missing / unreadable track directory yields no timestamp (field omitted, no
  crash). Idle and not-initialized cards omit last-modified.

## Non-functional

- Pure logic is TDD'd: porcelain `HEAD <sha>` parsing (`worktrees.test.ts`),
  relative-time formatting (`web`), and the mtime aggregation pipeline
  (`boardService.test.ts`). Coverage >80% for logic-bearing code only.
- The board stays read-only over `conductor/`; reads stay confined to each
  worktree (path safety preserved).
- `ProjectReads` abstraction is extended minimally; fakes in affected test files
  are updated.
- Biome and typecheck are clean.

## Acceptance criteria

- [ ] Detached card shows `detached (<7-char sha>)` end-to-end
      (parse → card → UI).
- [ ] Branch shown as a distinct badge line; path demoted; layout still readable
      on narrow widths.
- [ ] Card shows a relative last-modified time derived from its newest conductor
      file mtime; archived cards use the archive dir; a card without a readable
      track dir omits it (no crash).
- [ ] Server default port is 3002; the Vite dev proxy targets 3002; `PORT` env
      var still overrides.
- [ ] Server and web test suites pass; typecheck and Biome are clean.

## Out of scope

- Other card fields (e.g. commit counts, author).
- Live-ticking relative time (recomputes on re-render / board refresh only).
- Changing the track lifecycle (create/advance/archive).
- Multi-project aggregation.