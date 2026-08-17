# Implementation Plan: Show archived tracks in Complete column

## Phase 1 — Pure archived-track logic (TDD)

- [x] Task: Write failing unit tests for a new pure module `server/src/archiveTracks.ts`.
  - [x] `archivedTitle` returns the metadata.json `title` when it is a non-empty
        string (e.g. `{ "id": "x", "title": "Serve built frontend" }` -> "Serve
        built frontend").
  - [x] `archivedTitle` falls back to the archive folder name when `title` is
        missing (e.g. board-mvp-style `{ "track_id": "...", "status": "complete" }`)
        or empty.
  - [x] `archivedTitle` falls back to the folder name for malformed / unparseable
        JSON.
  - [x] `dedupeArchived` keeps the first card of duplicate archived trackIds and
        drops later duplicates.
  - [x] `dedupeArchived` leaves non-archived (active) cards untouched, including
        active cards that share an id across worktrees.
  - [x] `dedupeArchived` returns a new array and preserves order.
- [x] Task: Implement `server/src/archiveTracks.ts` to pass the tests.
- [x] Task: Refactor (optional) — keep implementation minimal.
- [x] Task: Phase Verification & Checkpoint (refer to workflow.md).
  - [checkpoint: 8427c22]

## Phase 2 — Wire archive discovery into board assembly (server)

- [x] Task: Add archive directory listing to the reads abstraction.
  - [x] Add `listArchiveDirs(worktreePath: string): Promise<string[]>` to the
        `ProjectReads` interface in `server/src/boardService.ts`.
  - [x] Implement it in `server/src/fsProjectReads.ts` using `readdir`
        (`conductor/archive`), returning entry names that are directories and
        `[]` when the directory is missing.
- [x] Task: Load archived tracks in `loadBoard`.
  - [x] For each worktree, enumerate archive dirs and build archived `TrackSource`
        entries (synthetic registry entry: state `'x'`, archived `true`) by reading
        `conductor/archive/<id>/metadata.json` (title) and `.../plan.md` (progress).
  - [x] Surface archive tracks even when `conductor/tracks.md` is missing but
        `conductor/archive/` exists (do not mark such worktrees `notInitialized`).
  - [x] Update `server/src/board.ts` to set `archived: boolean` on `TrackCard`
        (default `false`) and to run `dedupeArchived` over cards after composing
        them.
- [x] Task: Update/add server tests for archive discovery, archive-only worktrees,
      and cross-worktree de-duplication.
- [x] Task: Phase Verification & Checkpoint (refer to workflow.md).
  - [checkpoint: e86707e]

## Phase 3 — Frontend: open spec/plan from the archive path

- [x] Task: Add a pure path helper and use it in the board card actions.
  - [x] Add `web/src/trackDocPath.ts` returning
        `conductor/{archive|tracks}/{trackId}/{kind}.md` based on an `archived`
        flag, with unit tests (`web/src/trackDocPath.test.ts`).
  - [x] Add `archived?: boolean` to the `TrackCard` type in `web/src/types.ts`.
  - [x] In `web/src/Board.tsx`, pass `archived` through the modal target and use
        `trackDocPath` in `FileModal` instead of the hardcoded tracks path.
- [x] Task: Phase Verification & Checkpoint (refer to workflow.md).
  - [checkpoint: fb996d1]