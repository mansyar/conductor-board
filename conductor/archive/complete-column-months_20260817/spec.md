# Spec — Group the Complete column by month

## Overview

The Complete column can grow very long as tracks are archived (a real project
already has 60+). This track condenses it by grouping completed cards into
collapsible month sections, so the column starts compact and each month can be
expanded on demand. The collapse state is remembered per project.

| Today | Gap |
|---|---|
| Complete column is one long flat list | Group cards into month sections with expand/collapse |
| Collapse state lost on reload | Persist per project in `settings` |

## Functional Requirements

### FR-1 — Month bucketing (pure)
- Group a Complete column's cards by the month of `lastModifiedMs`.
- Cards with a missing `lastModifiedMs` go into an "Unsorted" section.
- Sections are ordered newest month first; "Unsorted" is last.

### FR-2 — Collapsible sections
- Each section shows a header (month label + card count) that toggles its cards.
- Sections default to collapsed.

### FR-3 — Persistence
- Per project, the set of expanded month sections is stored in the `settings`
  table; unlisted months are collapsed (so the default is all collapsed).
- `GET /api/preferences` returns the active project's expanded months;
  `PUT /api/preferences` saves them.

### FR-4 — Isolation
- Only the Complete column changes; Spec & Plan / Implement / Review, the idle
  lane, cross-worktree dedupe, and board progress aggregation are unchanged.

## Non-functional

- Pure logic is TDD'd: month bucketing/labeling (web), settings repository
  (server), and the preferences endpoints.
- The board stays read-only over `conductor/`; preferences write only to
  `board.db`.
- Biome and typecheck stay clean; no new dependencies.

## Acceptance criteria

- [ ] Complete column renders month sections, collapsed by default, newest first.
- [ ] Expanding a month persists across page reloads for that project only.
- [ ] Cards without a last-modified time appear under "Unsorted" without errors.
- [ ] Other columns, dedupe, and progress aggregation behave as before.
- [ ] Server and web test suites pass; typecheck and Biome are clean.

## Out of scope

- Grouping/collapsing other columns.
- Sorting or reordering cards within a month.
- Purging or editing archived tracks.
- Cross-project preference sharing.
