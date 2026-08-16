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
- [x] Task: Commit the plan update
- [x] Task: Phase Verification & Checkpoint [checkpoint: ea0d6d6] (user opted to rely on the passing integration tests)

## Phase 2 — API integration & quality gates

- [x] Task: Write failing integration tests for the API (`server/src/app.test.ts`)
  - [x] Test: `POST /api/projects` with a duplicate path returns `400` with an `error` matching `/already added/`
  - [x] Test: `POST /api/projects` for the first valid project returns `201` and `activeId === new id`
  - [x] Test: `POST` a second project while one is active leaves the active project unchanged
  - [x] Run tests and confirm the new tests pass (Green phase)
- [x] Task: Run full quality gates
  - [x] `bun run typecheck` passes
  - [x] `biome check .` passes
  - [x] Full test suite passes (`bun test`)
- [x] Task: Refactor (optional) and re-run the full suite
- [x] Task: Verify code coverage >80%
- [x] Task: Commit code with a descriptive message and attach a git-note summary
- [x] Task: Record the task commit SHA in this plan `[commit: ea0d6d6]`
- [x] Task: Commit the plan update
- [x] Task: Phase Verification & Checkpoint [checkpoint: ea0d6d6] (user opted to rely on the passing integration tests)

## Phase: Review Fixes
- [x] Task: Apply review suggestions [commit: f3116c4]