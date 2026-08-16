# Plan — Project Management Polish

## Phase 1 — Repository-level dedupe & auto-activate

- [~] Task: Write failing unit tests for dedupe + auto-activate (`server/src/projects.test.ts`)
  - [~] Test: `add` rejects a case-insensitive duplicate with a `/already added/` message
  - [~] Test: `add` auto-activates the first project when none is active
  - [~] Test: `add` does not auto-activate when another project is already active
  - [~] Run tests and confirm the new tests fail (Red phase)
- [x] Task: Implement dedupe + auto-activate in `server/src/projects.ts` (Green phase)
  - [x] Pre-check existing projects (case-insensitive compare on the resolved path) and throw a friendly `Project already added` error before insert
  - [x] After a successful insert, set active only when `getActive() === null`
  - [x] Run `server/src/projects.test.ts` and confirm all tests pass
- [x] Task: Refactor (optional) and re-run the suite
- [x] Task: Verify code coverage >80% for the new logic
- [x] Task: Commit code with a descriptive message and attach a git-note summary
- [x] Task: Record the task commit SHA in this plan `[commit: b537c36]`
- [ ] Task: Commit the plan update
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — API integration & quality gates

- [ ] Task: Write failing integration tests for the API (`server/src/app.test.ts`)
  - [ ] Test: `POST /api/projects` with a duplicate path returns `400` with an `error` matching `/already added/`
  - [ ] Test: `POST /api/projects` for the first valid project returns `201` and `activeId === new id`
  - [ ] Test: `POST` a second project while one is active leaves the active project unchanged
  - [ ] Run tests and confirm the new tests pass (Green phase)
- [ ] Task: Run full quality gates
  - [ ] `bun run typecheck` passes
  - [ ] `biome check .` passes
  - [ ] Full test suite passes (`bun test`)
- [ ] Task: Refactor (optional) and re-run the full suite
- [ ] Task: Verify code coverage >80%
- [ ] Task: Commit code with a descriptive message and attach a git-note summary
- [ ] Task: Record the task commit SHA in this plan `[commit: ...]`
- [ ] Task: Commit the plan update
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)