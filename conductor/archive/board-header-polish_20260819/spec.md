# Spec — Polish the board header (totals strip, progress bar, sparkline tooltip)

## Overview
The board header currently shows a single "N/M tasks complete · X%" line, the
trend sparkline with snapshot count and delta, the filter box, and Refresh. This
track polishes it into a more scannable status area: a compact per-column totals
strip, a slim full-width progress bar, and hover dots on the sparkline that
reveal each snapshot's percent and recorded date.

| Today | Gap |
|---|---|
| Per-column counts only inside each column header | Compact totals strip above the board with all four lifecycle counts |
| Plain "N/M tasks complete · X%" text | Slim full-width progress bar with the text kept above it |
| Sparkline is passive — no way to inspect a snapshot | Hover dots with per-snapshot percent + date |

## Functional Requirements

### FR-1 — Column totals strip
- Above the board, a compact row of four stat blocks — one per lifecycle column
  (Spec & Plan, Implement, Review, Complete) — each showing the column's card
  count with its phase color dot.
- Counts come from the already-loaded `board.cards` (per `columnId`), so no new
  API surface.
- The existing per-column header counts remain unchanged.

### FR-2 — Progress bar
- A slim full-width bar showing `done/total` ratio.
- The existing "N/M tasks complete · X%" label stays above it.
- No new interaction; dark-theme styling consistent with the card progress bars.

### FR-3 — Sparkline tooltip
- Each snapshot in the sparkline gets a hover target showing its `pct` and the
  date recorded (formatted from `observedAt`).
- Reuses the existing sparkline geometry (`sparklinePoints`); snapshots are
  already deduped/sparse so dots stay legible.
- Tooltip appears on hover/focus and dismisses on leave.

## Non-functional
- Pure logic (totals aggregation, date formatting for tooltips) is TDD'd; JSX
  layout is exempt per the project workflow.
- No new dependencies, no schema or endpoint changes; reuses `GET /api/history`
  and the already-loaded board data.
- Biome and typecheck stay clean.

## Acceptance criteria
- [ ] The header shows a totals strip with the four lifecycle column counts and
      phase dots.
- [ ] A slim progress bar reflects `done/total`, with the label kept above it.
- [ ] Hovering a sparkline snapshot shows its percent and recorded date; leaving
      dismisses it.
- [ ] Columns, month grouping, dedupe, and history recording behave as before.
- [ ] Server and web test suites pass; typecheck and Biome are clean.

## Out of scope
- Changing column grouping or card behavior.
- New persistence endpoints or schema changes.
- Adding/removing snapshots or changing history recording.
- Replacing the filter box or Refresh button.
