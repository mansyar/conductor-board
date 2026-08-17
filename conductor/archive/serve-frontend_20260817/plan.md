# Plan — Serve Built Frontend

## Phase 1 — Static-serving design & dependency

- [x] Task: Update `conductor/tech-stack.md` documenting static frontend serving
      (`@elysiajs/static`, served from `web/dist` when present) and the root `bun run serve`
      script (documented before implementation per workflow) [commit: 49bfc53]
- [x] Task: Add `@elysiajs/static` to `server/package.json` and install it [commit: b3d1218]
- [x] Task: Phase Verification & Checkpoint [checkpoint: b3d1218] (only docs + config changed; user confirmed)

## Phase 2 — TDD: serve-gating & SPA fallback

- [x] Task: Write failing tests (`server/src/app.test.ts` + a helper module test)
  - [x] Test: when `web/dist/index.html` exists, `GET /` returns the `index.html` content and a
        non-`/api` path also serves `index.html` (SPA fallback)
  - [x] Test: a built asset path resolves from `web/dist`
  - [x] Test: `/api/health` still returns its JSON (not HTML); an unknown `/api/*` path returns `404`
  - [x] Test: without a build present, serving is disabled and a non-`/api` GET is not served as HTML
  - [x] Run tests and confirm the new tests fail (Red phase) [commit: 89baa80]
- [x] Task: Implement serve-gating + SPA fallback in `server/src/app.ts`
  (resolving `web/dist`, enabling static only when `index.html` exists, and routing
  non-`/api` GET misses to `index.html`) to make the tests pass (Green phase) [commit: 89baa80]
- [x] Task: Refactor (optional) and re-run the suite
- [x] Task: Verify code coverage >80% for the new logic
- [x] Task: Commit code with a descriptive message and attach a git-note summary [commit: 89baa80]
- [x] Task: Record the task commit SHA in this plan `[commit: 89baa80]`
- [x] Task: Commit the plan update
- [x] Task: Phase Verification & Checkpoint [checkpoint: 89baa80] (user confirmed)

## Phase 3 — Root `serve` script & final gates

- [x] Task: Add `serve` script to the root `package.json`
      (`bun run build && bun run --filter @conductor-board/server start`) [commit: 982314a]
  - [x] Manual check: `bun run serve` builds the web app and serves the board at
        `http://localhost:3001`
- [x] Task: Run full quality gates (`bun run typecheck`, `biome check .`, `bun test`,
      coverage >80%)
- [x] Task: Commit with a descriptive message and attach a git-note summary [commit: 982314a]
- [x] Task: Record the task commit SHA in this plan `[commit: 982314a]`
- [x] Task: Commit the plan update
- [x] Task: Phase Verification & Checkpoint [checkpoint: 982314a] (user confirmed)

## Phase: Review Fixes
- [x] Task: Apply review suggestions [commit: 09d0287]
  - [x] Remove `@elysiajs/static` (dead dependency — the `get('*')` catch-all serves assets and
        fallback) and update `tech-stack.md` with a dated deviation note
  - [x] Guard `decodeURIComponent` against malformed URIs
  - [x] Re-run gates (`bun test`, typecheck, biome) — all pass