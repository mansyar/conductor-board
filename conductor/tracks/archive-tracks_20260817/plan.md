# Implementation Plan: Show archived tracks in Complete column

## Phase 1 — Pure archived-track logic (TDD)

- [ ] Task: Write failing unit tests for a new pure module `server/src/archiveTracks.ts`.
  - [ ] `archivedTitle` returns the metadata.json `title` when it is a non-empty
        string (e.g. `{ "id": "x", "title": "Serve built frontend" }` -> "Serve
        built frontend").
  - [ ] `archivedTitle` falls back to the archive folder name when `title` is
        missing (e.g. board-mvp-style `{ "track_id": "...", "status": "complete" }`)
        or empty.
  - [ ] `archivedTitle` falls back to the folder name for malformed / unparseable
        JSON.
  - [ ] `dedupeArchived` keeps the first card of duplicate archived trackIds and
        drops later duplicates.
  - [ ] `dedupeArchived` leaves non-archived (active) cards untouched, including
        active cards that share an id across worktrees.
  - [ ] `dedupeArchived` returns a new array and preserves order.
- [ ] Task: Implement `server/src/archiveTracks.ts` to pass the tests.
- [ ] Task: Refactor (optional) — keep implementation minimal.
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md).

## Phase 2 — Wire archive discovery into board assembly (server)

- [ ] Task: Add archive directory listing to the reads abstraction.
  - [ ] Add `listArchiveDirs(worktreePath: string): Promise<string[]>` to the
        `ProjectReads` interface in `server/src/boardService.ts`.
  - [ ] Implement it in `server/src/fsProjectReads.ts` using `readdir`
        (`conductor/archive`), returning entry names that are directories and
        `[]` when the directory is missing.
- [ ] Task: Load archived tracks in `loadBoard`.
  - [ ] For each worktree, enumerate archive dirs and build archived `TrackSource`
        entries (synthetic registry entry: state `'x'`, archived `true`) by reading
        `conductor/archive/<id>/metadata.json` (title) and `.../plan.md` (progress).
  - [ ] Surface archive tracks even when `conductor/tracks.md` is missing but
        `conductor/archive/` exists (do not mark such worktrees `notInitialized`).
  - [ ] Update `server/src/board.ts` to set `archived: boolean` on `TrackCard`
        (default `false`) and to run `dedupeArchived` over cards after composing
        them.
- [ ] Task: Update/add server tests for archive discovery, archive-only worktrees,
      and cross-worktree de-duplication.
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md).

## Phase 3 — Frontend: open spec/plan from the archive path

- [ ] Task: Add a pure path helper and use it in the board card actions.
  - [ ] Add `web/src/trackDocPath.ts` returning
        `conductor/{archive|tracks}/{trackId}/{kind}.md` based on an `archived`
        flag, with unit tests (`web/src/trackDocPath.test.ts`).
  - [ ] Add `archived?: boolean` to the `TrackCard` type in `web/src/types.ts`.
  - [ ] In `web/src/Board.tsx`, pass `archived` through the modal target and use
        `trackDocPath` in `FileModal` instead of the hardcoded tracks path.
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md).