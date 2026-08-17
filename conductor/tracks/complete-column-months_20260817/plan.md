# Plan — Group the Complete column by month

## Phase 1 — Month bucketing & labeling (pure) [checkpoint: ce70df1]
- [x] Task: **Red** — add `web/src/completeMonths.test.ts`: `monthBucketKey`
      returns `YYYY-MM` for an epoch-ms and `unsorted` for null; `monthBucketLabel`
      formats a key as `Month YYYY` (and `Unsorted`); `groupCardsByMonth` buckets
      Complete cards by `lastModifiedMs`, newest month first, unsorted last.
      Confirm it fails. (e7ef072)
- [x] Task: **Green** — implement `completeMonths.ts`. (ce70df1)
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)

## Phase 2 — Preferences persistence
- [ ] Task: **Red** — add `server/src/preferences.test.ts`:
      `createPreferencesRepository` stores and returns the expanded-months list per
      project (default `[]` when unset) in the `settings` table.
- [ ] Task: **Green** — implement `server/src/preferences.ts`.
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)

## Phase 3 — Preferences endpoints
- [ ] Task: **Red** — add app tests: `GET /api/preferences` returns 409 without an
      active project and the stored expanded months otherwise; `PUT
      /api/preferences` persists and echoes them.
- [ ] Task: **Green** — wire the endpoints into `server/src/app.ts`.
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)

## Phase 4 — Collapsible Complete column UI
- [ ] Task: add a `fetchPreferences`/`savePreferences` helper + `PreferencesResponse`
      type (thin fetch, exempt from mandatory tests).
- [ ] Task: render month sections in `web/src/Board.tsx` with expand/collapse
      (default collapsed) and persist toggles (JSX layout exempt).
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)
