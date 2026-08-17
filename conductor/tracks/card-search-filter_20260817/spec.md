# Card Search & Filter

Track: `card-search-filter_20260817` · Type: feature · Status: new

## Overview

Add a single search input in the board toolbar that filters kanban cards
client-side across all columns by any visible card text (track name, track id,
worktree path, branch). Matching cards stay in their lifecycle columns;
non-matching cards are hidden and affected columns read "No matches".

## Functional Requirements

1. The board toolbar shows a single search input for filtering cards.
2. Typing filters cards in place across all lifecycle columns **and** the idle lane.
3. The filter matches a case-insensitive substring against: track name, track id,
   worktree path, and branch.
4. Idle-lane cards are matched on worktree path / branch.
5. A column whose cards are all filtered out shows "No matches" in place of its card list.
6. Clearing the input restores the full board.
7. Filtering is purely client-side — no backend/API changes. It composes with the
   existing SSE live-refresh: a re-fetch applies the still-active filter to new data.
8. A whitespace-only query means "no filtering".

## Non-Functional Requirements

- Filter logic is a pure, unit-tested function (logic-bearing → tested per
  `workflow.md`, >80% coverage).
- Sentence case, minimal chrome, consistent with `product-guidelines.md`.
- The input is labeled/accessible (visible label or `aria-label`).

## Acceptance Criteria

- Typing a substring of a track name hides non-matching cards; matching cards remain in their columns.
- Matching by track id, worktree path, and branch each work.
- A fully-filtered column reads "No matches".
- Clearing the input shows all cards again.
- A live re-fetch while a filter is active still applies the filter and does not break the board.
- Filter unit tests pass.

## Out of Scope

- Server-side filtering / API changes.
- Per-column phase toggles or structured per-field dropdowns.
- Sorting, or persisting the filter query across sessions.
- Filtering by project (one project per board).