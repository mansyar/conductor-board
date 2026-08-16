# Spec — Conductor Board (MVP)

## Overview

A local web dashboard (Bun + ElysiaJS + `bun:sqlite` + React/Vite + Tailwind, monorepo
`server/` + `web/`) that renders a kanban showing, for one git project at a time, which
Conductor lifecycle phase each of its worktrees' tracks is in. Read-only over
`conductor/` files; phase is never inferred from git state.

## Functional Requirements

- **FR-1 Project management** — list persisted projects; add a project by path (validate
  it's a git repo and has a `conductor/` dir); remove a project; switch the active project.
- **FR-2 Worktree discovery** — `git -C <project> worktree list --porcelain` to enumerate
  worktree paths + branches; a worktree with no `conductor/` is flagged "not initialized"
  (not an error).
- **FR-3 Phase detection** — per worktree, parse its own `conductor/tracks.md` + inspect
  track folders:
  - `[ ]` → **Spec & Plan**; `[~]` → **Implement**; `[x]` (still under `tracks/`) → **Review**;
    folder under `conductor/archive/` → **Complete**.
- **FR-4 Board rendering** — four columns (`Spec & Plan → Implement → Review → Complete`),
  one card per track, plus an **Idle lane** for worktrees with no active track.
- **FR-5 Card content** — worktree + branch (primary), track name/id, plan progress
  (`done/total` + % from `plan.md` checkboxes), action affordances.
- **FR-6 Read actions** — open `spec.md`, open `plan.md` (inline markdown modal), copy path
  (Clipboard API).
- **FR-7 Refresh** — auto re-scan on tab focus + manual "Refresh" button.
- **FR-8 Persistence** — SQLite `projects` + `settings` tables (schema_version via
  `PRAGMA user_version`).

## API Surface

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/projects` | List projects (+ which is active). |
| POST | `/api/projects` | Add a project `{ path }`; validates and returns the record. |
| DELETE | `/api/projects/:id` | Remove a project. |
| PUT | `/api/projects/:id/active` | Set the active project. |
| GET | `/api/board` | Full board data for the active project. |
| GET | `/api/file` | Read a conductor file (spec/plan markdown), worktree-confined. |

(Open-in-Zed action deferred to a follow-up track.)

## Non-Functional Requirements

- **Read-only safety** — never writes to `conductor/`.
- **Path safety** — `/api/file` resolves only within a registered project's worktrees.
- **Graceful degradation** — missing `conductor/`, unreadable files, non-repo path → visible
  message, no crash.
- **Cross-platform** — Windows-first, but no hardcoded path separators.

## Acceptance Criteria

1. Registering a project path renders all its worktrees and correctly classifies each track's
   phase into the four columns (+ idle lane).
2. A worktree with multiple active tracks yields one card per track.
3. The `Complete` column includes tracks whose folder is under `conductor/archive/`, even if
   still listed `[x]` in `tracks.md`.
4. Open spec / open plan render markdown; copy path copies to clipboard.
5. Refresh on tab focus and via button reflects external changes to `conductor/` files.
6. Adding an invalid path (not a git repo) is rejected with a clear message.
7. Board never mutates any `conductor/` file.

## Out of Scope (this track)

- Open in Zed (deferred).
- Detached-HEAD polish (still handled non-fatally as `(detached)`).
- `conductor/index.md` path relinking (default paths only).
- Live file watcher; phase-history analytics.
