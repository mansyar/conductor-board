# Spec — Polish the Complete column's month-section UI

## Overview

The Complete column now groups archived tracks into collapsible month sections.
This track polishes that UI: styled count badges on each month header, sticky
headers that stay visible while scrolling through a month, and an expand-all /
collapse-all control in the column header. The expanded state continues to
persist per project via the existing `/api/preferences`.

| Today | Gap |
|---|---|
| Plain count text next to each month label | Styled badge with the month's card count |
| Headers scroll away with their cards | Headers pin to the top of the viewport while their month is on screen |
| Only per-month expand/collapse | Expand all / Collapse all control in the column header |
| — | Control result persists per project (reuses existing preferences) |

## Functional Requirements

### FR-1 — Count badges
- Each month section header shows the card count as a styled badge (rounded
  pill, muted background) instead of plain text.
- The `Unsorted` bucket gets the same badge treatment.

### FR-2 — Sticky headers
- Month section headers use sticky positioning within the page scroll: while a
  month's cards are on screen, its header stays pinned near the top of the
  viewport, then scrolls away with the section when the next month arrives.
- Sticky headers have a solid background so scrolled content does not show
  through.
- No changes to the board's overall layout or scroll containers.

### FR-3 — Expand all / Collapse all control
- The Complete column header gains a small toggle button.
- Label logic: shows **Expand all** when not every month is expanded; shows
  **Collapse all** when every month is expanded.
- Clicking it expands (or collapses) every month section, including the
  `Unsorted` bucket.
- The resulting set is persisted per project via `PUT /api/preferences` (same
  mechanism as individual toggles).
- Individual month toggles continue to work after using the control.
- The control is hidden when the column has no months.

## Non-functional

- Expand/collapse-all state logic is pure and TDD'd in `completeMonths.ts`
  (consistent with the existing pure-helper tests).
- Badge styling, sticky classes, and the control's JSX are layout-exempt (per
  project workflow).
- No new dependencies, no schema or endpoint changes; reuses `GET/PUT
  /api/preferences`.
- Biome and typecheck stay clean.

## Acceptance criteria

- [ ] Month headers show styled count badges (including `Unsorted`).
- [ ] Month headers stick to the top of the viewport while their section is visible.
- [ ] The Complete column header shows an Expand all / Collapse all toggle with correct label logic.
- [ ] Clicking the toggle flips all months and persists the result per project across reloads.
- [ ] Individual month toggles still work after using the control.
- [ ] Grouping, other columns, dedupe, and progress aggregation behave as before.
- [ ] Server and web test suites pass; typecheck and Biome are clean.

## Out of scope

- Changing month grouping or ordering.
- Other columns and the idle lane.
- New persistence endpoints or schema changes.
- Board layout changes (scroll containers, column sizing).
