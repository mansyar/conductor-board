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
  then starts the server, serving the whole board on `:3001`.
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

## Frontend

- **React** — single-page app rendering the kanban board.
- **Tailwind CSS** — styling.
- **TypeScript** — throughout (backend and frontend).
- **Markdown rendering** (added 2026-08-17) — spec/plan modals render markdown:
  - **marked** — markdown → HTML parsing, alongside **marked-highlight** to hook in highlighting.
  - **DOMPurify** — sanitize rendered HTML before injection.
  - **highlight.js** — syntax highlighting for fenced code blocks (board-dark theme).

## Testing

- **bun test** — built-in test runner. Applied to logic-bearing code only (per `workflow.md`).
