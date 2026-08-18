# Plan — Polish the Complete column's month-section UI

## Phase 1 — Expand/collapse-all state logic (pure) [checkpoint: 9812d2f]
- [x] Task: **Red** — extend `web/src/completeMonths.test.ts`:
      `allMonthsExpanded(monthKeys, expanded)` returns `true` only when every
      month key (including `unsorted`) is in the expanded set;
      `nextExpansionSet(monthKeys, expanded)` returns a set with every key
      expanded when not all are, and with every key removed when all are.
      Confirm the tests fail. (97545c9)
- [x] Task: **Green** — implement `allMonthsExpanded` and `nextExpansionSet` in
      `completeMonths.ts`. (9812d2f)
- [ ] Task: **Green** — implement `allMonthsExpanded` and `nextExpansionSet` in
      `completeMonths.ts`.
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)

## Phase 2 — Count badges & sticky headers [checkpoint: 47ce0ac]
- [x] Task: render month-header counts as styled badges (rounded pill) and make
      month headers sticky within the page scroll with a solid background (JSX
      layout exempt). (47ce0ac)
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)

## Phase 3 — Expand-all / collapse-all control
- [ ] Task: add an "Expand all"/"Collapse all" toggle to the Complete column
      header that flips every month's state via the Phase 1 logic and persists
      it with `savePreferences`; hidden when the column has no months (JSX
      exempt).
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)
