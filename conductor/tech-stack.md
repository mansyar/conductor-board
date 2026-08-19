# Tech Stack

## Runtime & Tooling

- **Bun** — runtime, package manager, and test runner.
- **Zed** — primary editor/IDE (board actions open worktrees in Zed).
  The board opens a worktree by spawning `zed <path>` via `node:child_process`;
  the `zed` CLI must be on the PATH of the process running the server.
- **git** — version control, with linked worktrees as the core workflow.
- **Biome** — linter and formatter.

## Backend

- **ElysiaJS** — type-safe HTTP framework serving the JSON API and static frontend.
- **Static frontend serving** (added 2026-08-17) — the server serves the compiled SPA from
  `web/dist`, with a catch-all serving `index.html` for non-`/api` GETs (SPA fallback). Static
  serving is enabled at runtime only when `web/dist/index.html` exists, so the `bun run dev`
  loop (Vite + `/api` proxy) is unaffected. The root `bun run serve` script builds the web app
  then starts the server, serving the whole board on `:3002`.
- **Default port deviation note** (2026-08-17) — the default serve/dev port moved from `3001`
  to `3002` (in `server/src/index.ts` and the Vite `/api` proxy in `web/vite.config.ts`) so port
  `3001` is free for the user's e2e tests. The server still honors a `PORT` env-var override.
- **Static-serving deviation note** (2026-08-17) — the original plan specified serving via the
  `@elysiajs/static` plugin. During review it was dropped: Elysia's route precedence let the
  `get('*')` catch-all win, so the plugin never served a request (dead dependency). Serving is
  instead handled entirely by the catch-all handler (`Bun.file` for existing files, `index.html`
  fallback), with `resolveWithin` guarding against path traversal.
- **bun:sqlite** — built-in SQLite driver for persistence (projects + settings).
- **Live board updates via Server-Sent Events** (added 2026-08-17) — `GET /api/events`
  streams `board-changed` events over SSE. A recursive `fs.watch` monitors the active
  project's worktree `conductor/` directories (500ms debounced) and the SPA re-fetches
  `/api/board` on each event. Manual Refresh + window-focus refresh remain as fallbacks.
- **Phase-history snapshots** (added 2026-08-17) — after each successful board load the
  server records a deduplicated snapshot of aggregate progress and per-column counts into
  the `snapshots` table (schema v2), and `GET /api/history` serves the recent window. The
  SPA renders a progress sparkline + trend delta from it.
- **Per-project preferences** (added 2026-08-17) — `GET/PUT /api/preferences` read and
  write the active project's expanded Complete-column months, stored as JSON in the
  `settings` table (default: all months collapsed).

## Frontend

- **React** — single-page app rendering the kanban board.
- **Tailwind CSS** — styling.
- **TypeScript** — throughout (backend and frontend).
- **Markdown rendering** (added 2026-08-17) — spec/plan modals render markdown:
  - **marked** — markdown → HTML parsing, alongside **marked-highlight** to hook in highlighting.
  - **DOMPurify** — sanitize rendered HTML before injection.
  - **highlight.js** — syntax highlighting for fenced code blocks (board-dark theme).
- **Collapsible Complete column** (added 2026-08-17) — completed cards are grouped by
  month (from `lastModifiedMs`, newest first, with an `Unsorted` bucket) into collapsible
  sections that default to collapsed; expansion state loads from and persists to
  `/api/preferences` per project.
- **Month-section UI polish** (added 2026-08-18) — month headers show styled count
  badges and stick to the viewport top while their section is on screen, and the
  Complete column header gains an expand-all / collapse-all control (pure helpers
  `allMonthsExpanded` / `nextExpansionSet` in `web/src/completeMonths.ts`) that flips
  every month's state and persists it via the same `/api/preferences` endpoints.
- **Board header polish** (added 2026-08-19) — the header shows a per-column totals
  strip (phase dot + count via `columnTotals` in `web/src/boardHeader.ts`), a slim
  full-width progress bar, and hover/focus targets over each sparkline snapshot
  showing its percent and recorded date (via `formatSnapshotDate` and the extracted
  `sparklineCoords` helper).

## Testing

- **bun test** — built-in test runner. Applied to logic-bearing code only (per `workflow.md`).
