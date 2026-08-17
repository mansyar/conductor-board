# Track: Show archived tracks in Complete column

## Context

The board currently renders a card only for each track listed in a worktree's
`conductor/tracks.md` registry. Completed tracks that are archived (moved to
`conductor/archive/<id>/` and removed from the active registry) therefore
disappear from the board entirely. This track makes the board also surface
archived tracks in the **Complete** column by scanning each worktree's
`conductor/archive/` directory and de-duplicating across worktrees.

The product is a read-only kanban of a project's tracked lifecycle; the
Complete column should reflect finished work even after it is archived.

## Requirements

### Functional

- **Archive discovery.** For each tracked worktree, the board enumerates the
  subdirectories of `<worktree>/conductor/archive/`. Each subdirectory
  corresponds to one archived track and becomes a card in the **Complete**
  column.
- **Card title.** Taken from `conductor/archive/<id>/metadata.json` `title`
  field when present (a non-empty string); otherwise the archive folder name.
  Handle the inconsistent metadata schema and malformed/missing metadata.json
  gracefully.
- **Card progress.** Computed with `countPlanProgress` over
  `conductor/archive/<id>/plan.md` (normally 100%). Unreadable/missing plan.md
  yields 0/0.
- **No duplicate cards.** The same archived track present in **multiple
  worktrees** renders as a single card (de-duplicated by archived-track id
  across the whole project, keeping the first occurrence).
- **Archive-only worktrees are not idle.** A worktree with no active tracks
  but with archived tracks renders its archived Complete cards instead of
  appearing in the idle lane.
- **Viewing spec/plan.** For archived cards, Spec/Plan open the archive path
  (`conductor/archive/<id>/spec.md`, `.../plan.md`), not the tracks path.

### Non-functional

- Board assembly stays server-side in `GET /api/board`; no new API endpoint.
- Pure logic is TDD'd; test coverage > 80% for logic-bearing code only.
- Follows existing TypeScript, Biome, and Bun test conventions in `server/`
  and `web/`. Changes are minimal and surgical.

## Acceptance criteria

- [ ] A project whose worktrees contain archived tracks shows one card per
      unique archived track in the **Complete** column.
- [ ] An archived track present in several worktrees yields a single card, not
      one per worktree.
- [ ] A worktree holding only archived tracks is rendered as Complete cards
      rather than idle.
- [ ] Spec/Plan for an archived card open from the archive path.
- [ ] Existing active-track behavior and board progress aggregation are
      unchanged.
- [ ] Server and web test suites pass; typecheck and Biome are clean.

## Out of scope

- Creating, archiving, or editing tracks (the board remains read-only).
- Showing archived tracks in columns other than Complete.
- Changing the conductor workflow that removes completed tracks from the
  active registry.