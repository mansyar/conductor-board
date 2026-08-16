# Spec — Serve Built Frontend

## Overview

The PRD and `tech-stack.md` describe the server as serving "the JSON API + the built
frontend as static files," but today `app.ts` exposes only the API. In development the
frontend comes from Vite (which proxies `/api` → `:3001`), and there is **no production
path** to view the board. This track makes the Elysia server host the compiled SPA from
`web/dist` (with an SPA history fallback) and adds a single root script, `bun run serve`,
that builds the web app then starts the server — so the entire board runs from one process
and one port.

## Functional Requirements

- **FR1 — Serve compiled assets:** when `web/dist/index.html` exists, the server serves the
  SPA assets from `web/dist` (resolved relative to the server package, cross-platform).
- **FR2 — Runtime gating:** static serving is enabled only when `web/dist/index.html` is
  present; otherwise the server remains API-only. The `bun run dev` loop (Vite + `/api`
  proxy) is unchanged.
- **FR3 — SPA fallback:** GET requests that are not under `/api` and do not match an
  existing asset return `index.html` (`200`) so future client-side routes resolve on refresh.
- **FR4 — API unaffected:** every `/api/*` route keeps its existing behavior and never falls
  through to the fallback; an unknown `/api/*` path returns `404`, not HTML.
- **FR5 — Single-command run:** `bun run serve` (repo root) builds the web app then starts
  the server, serving the board at `http://localhost:3001`.

## Non-Functional Requirements

- Preserve board read-only safety (no writes to `conductor/`).
- Keep `bun run dev` working unchanged for the development loop.
- Cross-platform path resolution (no hardcoded path separators).

## Acceptance Criteria

- **AC1:** With a build present, starting the server serves the SPA at `/`; static assets
  resolve and a non-`/api` path returns `index.html`.
- **AC2:** `/api/health` returns its JSON, and an unknown `/api/*` path returns `404` (not
  HTML).
- **AC3:** Without a build (no `web/dist/index.html`), the server starts API-only and does
  not attempt to serve the frontend.
- **AC4:** `bun run serve` builds the web app and then serves it on `:3001`.
- **AC5:** Full quality gates pass (`bun run typecheck`, `biome check .`, `bun test`),
  including new tests for the serve-gating and SPA-fallback logic.

## Out of Scope

- Replacing the Vite development loop.
- Multi-project on one port, authentication, or deployment automation (Docker, TLS).
- Client-side routing changes (only the fallback is added).
- Configuring a custom static directory (always resolves to `web/dist`).