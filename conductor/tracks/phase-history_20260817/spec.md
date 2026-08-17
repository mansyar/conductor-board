# Spec — Phase-history snapshots & progress trend

## Overview

The board shows a project's lifecycle at a single instant. Each refresh
overwrites the previous picture, so there is no way to see whether work is
actually moving — only where it stands right now. This track gives the board a
memory: every time the board state changes, a snapshot of the aggregate progress
and per-column card counts is recorded, and the UI renders a small progress
sparkline plus a trend summary so momentum is visible at a glance.

| Today | Gap |
|---|---|
| `/api/board` recomputes and discards the previous state | Persist a snapshot whenever the board state changes |
| `bun:sqlite` schema only has `projects` + `settings` | Add a versioned `snapshots` table (schema v2) |
| The header shows only current `done/total · pct%` | Add a progress sparkline over time with a trend delta |

## Functional Requirements

### FR-1 — Versioned snapshot schema
- `server/src/db.ts` gains a step-based migration (schema version 2) that adds
  a `snapshots` table keyed by project and observation time.
- Columns: `id`, `project_id`, `observed_at`, `state_hash`, `done`, `total`,
  `spec_plan`, `implement`, `review`, `complete`, plus an index on
  `(project_id, observed_at)`.
- Existing v1 databases migrate in place without data loss; `:memory:` databases
  still migrate cleanly.

### FR-2 — Board summary & change detection
- A pure `summarizeBoard(board)` reduces a loaded board to
  `{ done, total, specPlan, implement, review, complete }` (progress from
  `board.progress`, counts from cards per column; idle cards are excluded).
- A deterministic `computeStateHash(summary)` fingerprints the summary; a new
  snapshot is recorded only when the hash differs from the project's most recent
  snapshot (no duplicate rows on repeated refresh/focus with no change).

### FR-3 — Snapshot persistence & endpoint
- A `createSnapshotRepository(db)` exposes insert + latest-hash + recent-list
  operations.
- After a successful `GET /api/board` load, the server records a snapshot for the
  active project (deduplicated by hash). The board remains read-only over
  `conductor/`; snapshots write only to the board's own SQLite.
- `GET /api/history` returns the active project's recent snapshots ascending by
  time: `{ projectId, snapshots: [{ observedAt, done, total, pct, specPlan, implement, review, complete }] }`.
  Unknown/missing active project returns the same 409/404 contract as `/api/board`.

### FR-4 — Progress trend in the UI
- The header area gains a compact inline-SVG sparkline of `pct` over time, plus a
  short caption such as `12 snapshots · +8% since yesterday`.
- The sparkline renders only when at least two snapshots exist; with one or zero
  it is hidden and the caption degrades gracefully.
- Pure sparkline point generation and trend-delta math live in testable `web/src`
  helpers (no chart dependency).

## Non-functional

- Pure logic is TDD'd: migration steps (`db.test.ts`), `summarizeBoard` /
  `computeStateHash` / dedupe (`history.test.ts`), repository insert/list/latest,
  and the `web` sparkline + trend helpers. Coverage >80% for logic-bearing code only.
- The board stays read-only over `conductor/`; snapshot writes touch only
  `board.db` and are idempotent.
- Snapshot volume is bounded: at most one row per observed state change, and the
  history endpoint caps the returned window (e.g. last 100).
- Biome and typecheck stay clean; no new runtime dependencies.

## Acceptance criteria

- [ ] A project with no prior snapshots records one snapshot on its first board
      load, and a changed board records another; an unchanged reload records none.
- [ ] `/api/history` returns ascending snapshots with `done`, `total`, `pct`, and
      per-column counts for the active project.
- [ ] The header shows a progress sparkline and a trend caption once two or more
      snapshots exist, and hides them otherwise.
- [ ] Existing v1 databases migrate to v2 without losing projects/settings.
- [ ] Server and web test suites pass; typecheck and Biome are clean.

## Out of scope

- Per-worktree or per-track history (aggregate project trend only).
- A charting library or interactive/zoomable timeline; a static sparkline only.
- Pruning/expiry beyond capping the API's returned window.
- Multi-project history aggregation in one view.
- Changing the read-only nature of the board over `conductor/`.
