# Tech Stack

## Runtime & Tooling

- **Bun** — runtime, package manager, and test runner.
- **Zed** — primary editor/IDE (board actions open worktrees in Zed).
- **git** — version control, with linked worktrees as the core workflow.
- **Biome** — linter and formatter.

## Backend

- **ElysiaJS** — type-safe HTTP framework serving the JSON API and static frontend.
- **bun:sqlite** — built-in SQLite driver for persistence (projects + settings).

## Frontend

- **React** — single-page app rendering the kanban board.
- **Tailwind CSS** — styling.
- **TypeScript** — throughout (backend and frontend).

## Testing

- **bun test** — built-in test runner. Applied to logic-bearing code only (per `workflow.md`).
