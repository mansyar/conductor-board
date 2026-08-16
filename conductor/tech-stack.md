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
- **bun:sqlite** — built-in SQLite driver for persistence (projects + settings).

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
