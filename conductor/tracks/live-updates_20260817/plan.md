# Plan — Live Board Updates

## Phase 1 — Server-side watcher & broadcast engine

- [x] Task: Write failing unit tests for a debounce helper (`debounce.ts`)
  - [x] Test: multiple calls within the window invoke the callback once
  - [x] Test: a trailing call after the window flushes once more
  - [x] Run tests and confirm they fail (Red phase)
- [x] Task: Write failing unit tests for a `FileWatcher` (`liveUpdates.ts`)
  - [x] Test: registers a recursive `fs.watch` on each worktree's `conductor/` of the active project
  - [x] Test: a change anywhere under a watched dir emits a debounced `changed` event (500ms)
  - [x] Test: a missing/unwatchable worktree dir is tolerated and does not throw
  - [x] Test: `close()` unwatches all registered dirs and prevents further events
  - [x] Run tests and confirm they fail (Red phase)
- [x] Task: Implement `debounce.ts` and `liveUpdates.ts` to pass the failing tests (Green phase)
- [x] Task: Refactor (optional) and re-run the full suite
- [x] Task: Verify code coverage >80% for the new logic
- [x] Task: Commit code with a descriptive message and attach a git-note summary
- [x] Task: Record the task commit SHA in this plan `[commit: b88c25b]`
- [x] Task: Commit the plan update
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — SSE integration in the Elysia app

- [ ] Task: Write failing tests for the SSE endpoint and project-switch wiring (`app.ts` / `appLive.test.ts`)
  - [ ] Test: `GET /api/events` returns a `text/event-stream` stream and keeps the connection open
  - [ ] Test: with a fake watcher + fake stream, a watcher `changed` event produces a `board-changed` SSE message to connected clients
  - [ ] Test: with no active project the endpoint does not stream an error on every connect (graceful)
  - [ ] Test: `PUT /api/projects/:id/active` tears down the old watcher and registers one for the new active project's worktrees
  - [ ] Test: multiple connected clients each receive the broadcast
  - [ ] Run tests and confirm they fail (Red phase)
- [ ] Task: Implement SSE route and watcher lifecycle wiring to pass the tests (Green phase)
- [ ] Task: Refactor (optional) and re-run the full suite
- [ ] Task: Verify code coverage >80%
- [ ] Task: Commit code with a descriptive message and attach a git-note summary
- [ ] Task: Record the task commit SHA in this plan
- [ ] Task: Commit the plan update
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Frontend live subscription

- [ ] Task: Write failing unit tests for a live-subscription helper (`liveSubscribe.ts`)
  - [ ] Test: on `board-changed` the provided `onBoardChanged` callback fires
  - [ ] Test: opening/`close()` lifecycle on subscribe/unsubscribe
  - [ ] Test: tolerant of a reconnecting EventSource (no duplicate callbacks while disconnected)
  - [ ] Run tests and confirm they fail (Red phase)
- [ ] Task: Implement `liveSubscribe.ts` and wire it into `Board.tsx`
  - [ ] Test: `Board` opens the subscription when `activeId` is present and closes on unmount/id change
  - [ ] Test: a `board-changed` event invokes the existing board `load()`
  - [ ] Run tests and confirm they fail for the wiring (Red phase)
- [ ] Task: Implement `Board` wiring to pass the tests (Green phase)
- [ ] Task: Refactor (optional) and run `bun run check` + `bun run typecheck` + tests
- [ ] Task: Verify code coverage >80%
- [ ] Task: Commit code with a descriptive message and attach a git-note summary
- [ ] Task: Record the task commit SHA in this plan
- [ ] Task: Commit the plan update
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — End-to-end verification & docs

- [ ] Task: Manually verify Acceptances AC1–AC5 end-to-end against a real project
  - [ ] AC1: editing a conductor file in any active-project worktree updates the board within ~1s
  - [ ] AC2: rapid multi-file changes produce exactly one refresh
  - [ ] AC3: switching projects re-points the watcher correctly
  - [ ] AC4: no-active-project handling is graceful and re-establishes on selection
  - [ ] AC5: manual Refresh and window-focus refresh still work
- [ ] Task: Update `conductor/tech-stack.md` with a dated note if the stack changed (e.g. SSE usage)
- [ ] Task: Commit docs/verification notes and attach a git-note summary
- [ ] Task: Record the task commit SHA in this plan
- [ ] Task: Commit the plan update
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)