# Implementation Plan — Card Search & Filter

## Phase 1 · Pure filter logic (TDD)

- [x] Task: Write failing unit tests for `filterCards` (`web/src/filterCards.test.ts`)
  - [x] matches track name (case-insensitive substring)
  - [x] matches track id
  - [x] matches worktree path
  - [x] matches branch
  - [x] whitespace-only query returns cards unchanged
  - [x] no match returns empty list
- [x] Task: Implement `filterCards` (`web/src/filterCards.ts`) to pass tests
- [x] Task: Refactor (optional) — no refactor needed, implementation already minimal
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md)

## Phase 2 · Wire filter into the board UI

- [ ] Task: Add a single search input to the board toolbar (labeled/aria-label, minimal chrome)
- [ ] Task: Add `filter` state and apply `filterCards` to column and idle cards on each render
- [ ] Task: Show "No matches" in affected columns when the filter is active and a column has no matching cards
- [ ] Task: Clearing the input restores the full board
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md)