# Plan — Open in Zed

## Phase 1 — Server `POST /api/open-zed`

- [x] Task: Write failing tests for an `openZed` spawn helper (resolves `zed` on PATH, spawns `zed <path>`, rejects on spawn error like ENOENT)
- [x] Task: Implement the `openZed` helper in `server/src/openZed.ts` to make the tests pass
- [x] Task: Write failing tests for the `POST /api/open-zed` route covering: no active project (409), active project missing (404), non-worktree path (404), path escape (404), spawn failure (503), success (200)
- [x] Task: Wire the route in `server/src/app.ts` reusing the active-project lookup pattern and exact worktree-membership matching
- [x] Task: Refactor and verify code coverage >80% for new logic-bearing code (`bun test`)
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)

## Phase 2 — Frontend Open in Zed button + toast

- [x] Task: Add a thin `openZed(worktreePath)` request helper in `web/src/openZed.ts` that POSTs to `/api/open-zed` and throws a normalized error
- [x] Task: Add an **Open in Zed** button to `TrackCardView` so it renders on every track card and idle-lane entry (reuse existing `onCopy`-style affordance wiring)
- [x] Task: Add a minimal toast surface in `Board.tsx` and show the server error message on failure
- [x] Task: Run `bun run typecheck`, `bun run check`, and the full `bun test` suite; confirm green
- [x] Task: Manual verification — happy path confirmed (Zed opened a worktree via the button); failure path covered by automated tests (not manually exercised)
- [x] Task: Phase Verification & Checkpoint (refer to `workflow.md`)

[checkpoint: e91ec0a]
