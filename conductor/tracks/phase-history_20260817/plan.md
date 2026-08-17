# Plan — Phase-history snapshots & progress trend

## Phase 1 — Versioned snapshot schema [checkpoint: f158d7a]
- [x] Task: **Red** — extend `server/src/db.test.ts`: migrating a v1 database to
      v2 creates the `snapshots` table and index, preserves existing
      `projects`/`settings` rows, and sets `PRAGMA user_version` to 2. Confirm it
      fails. (f41e4bf)
- [x] Task: **Green** — refactor `migrate` in `server/src/db.ts` into a step-based
      loop over versioned SQL migrations, bump `SCHEMA_VERSION` to 2, and add the
      `snapshots` DDL (columns: `id`, `project_id`, `observed_at`, `state_hash`,
      `done`, `total`, `spec_plan`, `implement`, `review`, `complete`) plus the
      `(project_id, observed_at)` index. (f158d7a)
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)

## Phase 2 — Board summary & change detection (pure logic) [checkpoint: 39b487d]
- [x] Task: **Red** — add `server/src/history.test.ts`: `summarizeBoard` reduces a
      board to `{ done, total, specPlan, implement, review, complete }` (idle cards
      excluded); `computeStateHash` is deterministic and differs when any summary
      field changes; `shouldRecordSnapshot` is true for a null previous hash and
      for a different hash, false for an equal hash. Confirm it fails. (ba8eed2)
- [x] Task: **Green** — implement `summarizeBoard`, `computeStateHash`, and
      `shouldRecordSnapshot` in `server/src/history.ts`. (39b487d)
- [x] Task: Refactor (optional) — keep the summary/hash implementation minimal and
      collision-safe for the small summary shape.
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)

## Phase 3 — Snapshot persistence, recording, and endpoint [checkpoint: 7d2d9c0]
- [x] Task: **Red** — add `server/src/historyRepository.test.ts`: the repository
      inserts a snapshot, returns the latest `state_hash` (null when empty), and
      lists recent snapshots ascending by `observed_at` capped by a limit. Confirm
      it fails. (5b38009)
- [x] Task: **Green** — implement `createSnapshotRepository(db)` in
      `server/src/historyRepository.ts` using `bun:sqlite` prepared statements. (9abf1a0)
- [x] Task: **Red** — extend `server/src/appBoard.test.ts` / add an app test: a
      successful `/api/board` load records exactly one snapshot per distinct board
      state; an unchanged reload records none; `GET /api/history` returns the
      ascending snapshot list and the 409/404 contract matches `/api/board`.
      Confirm it fails. (37d5027)
- [x] Task: **Green** — wire the repository into `createApp`; record a
      deduplicated snapshot after `loadBoard` in the `/api/board` handler; add
      `GET /api/history`. (7d2d9c0)
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)

## Phase 4 — Progress trend in the UI
- [x] Task: **Red** — add `web/src/sparkline.test.ts` and `web/src/trend.test.ts`:
      `sparklinePoints` maps a values array to an SVG polyline string within a
      given width/height (handles flat and empty series); `trendDelta` returns the
      first-to-last percentage-point change and its direction. Confirm they fail. (89e6a25)
- [x] Task: **Green** — implement `sparkline.ts` and `trend.ts`; add a
      `HistorySnapshot` type and a `fetchHistory` helper. (73a4cb0)
- [ ] Task: render the sparkline + trend caption in `web/src/Board.tsx` next to the
      progress summary, hidden below two snapshots (JSX layout is exempt from the
      mandatory-testing scope).
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)
