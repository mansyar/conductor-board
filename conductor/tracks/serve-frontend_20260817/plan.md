# Plan — Serve Built Frontend

## Phase 1 — Static-serving design & dependency

- [x] Task: Update `conductor/tech-stack.md` documenting static frontend serving
      (`@elysiajs/static`, served from `web/dist` when present) and the root `bun run serve`
      script (documented before implementation per workflow) [commit: 49bfc53]
- [ ] Task: Add `@elysiajs/static` to `server/package.json` and install it
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — TDD: serve-gating & SPA fallback

- [ ] Task: Write failing tests (`server/src/app.test.ts` + a helper module test)
  - [ ] Test: when `web/dist/index.html` exists, `GET /` returns the `index.html` content and a
        non-`/api` path also serves `index.html` (SPA fallback)
  - [ ] Test: a built asset path resolves from `web/dist`
  - [ ] Test: `/api/health` still returns its JSON (not HTML); an unknown `/api/*` path returns `404`
  - [ ] Test: without a build present, serving is disabled and a non-`/api` GET is not served as HTML
  - [ ] Run tests and confirm the new tests fail (Red phase)
- [ ] Task: Implement serve-gating + SPA fallback in `server/src/app.ts`
  (resolving `web/dist`, enabling static only when `index.html` exists, and routing
  non-`/api` GET misses to `index.html`) to make the tests pass (Green phase)
- [ ] Task: Refactor (optional) and re-run the suite
- [ ] Task: Verify code coverage >80% for the new logic
- [ ] Task: Commit code with a descriptive message and attach a git-note summary
- [ ] Task: Record the task commit SHA in this plan `[commit: <sha>]`
- [ ] Task: Commit the plan update
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Root `serve` script & final gates

- [ ] Task: Add `serve` script to the root `package.json`
      (`bun run build && bun run --filter @conductor-board/server start`)
  - [ ] Manual check: `bun run serve` builds the web app and serves the board at
        `http://localhost:3001`
- [ ] Task: Run full quality gates (`bun run typecheck`, `biome check .`, `bun test`,
      coverage >80%)
- [ ] Task: Commit with a descriptive message and attach a git-note summary
- [ ] Task: Record the task commit SHA in this plan `[commit: <sha>]`
- [ ] Task: Commit the plan update
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)