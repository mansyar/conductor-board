# Plan — Polish the board header (totals strip, progress bar, sparkline tooltip)

## Phase 1 — Totals aggregation & tooltip date formatting (pure) [checkpoint: e5aa28f]
- [~] Task: **Red** — add `web/src/boardHeader.test.ts`:
      `columnTotals(cards)` returns counts per `ColumnId` for the four lifecycle
      columns (idle ignored, unknown column ids ignored); `formatSnapshotDate(iso)`
      formats an ISO timestamp as a short date label (e.g. `Aug 17`), falling back
      to `iso` when unparseable. Confirm the tests fail. (c72a439)
- [x] Task: **Green** — implement `boardHeader.ts` with `columnTotals` and
      `formatSnapshotDate`. (e5aa28f)
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)

## Phase 2 — Totals strip & progress bar (JSX) [checkpoint: 52da3a2]
- [x] Task: render the four-block totals strip above the board (phase dot + count
      per lifecycle column) and the slim full-width progress bar under the
      existing "N/M tasks complete · X%" label (JSX layout exempt, driven by
      `columnTotals` and `board.progress`). (52da3a2)
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)

## Phase 3 — Sparkline tooltip (JSX)
- [x] Task: add hover/focus targets over each snapshot in the sparkline showing
      its percent and `formatSnapshotDate(observedAt)` date; dismiss on leave
      (JSX layout exempt). (55c084f)
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)
