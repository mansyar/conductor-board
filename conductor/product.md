# Conductor Board

A local web dashboard that surfaces the Conductor development lifecycle across a
project's git worktrees as a single kanban board.

## Overview

When working on a project following the Conductor methodology — where features and
fixes are tracked as "tracks" (`conductor/tracks/<id>/`) across multiple git
worktrees — it is hard to see at a glance where each piece of work stands. Conductor
Board reads the Conductor files inside each worktree's own checkout and renders every
track onto a four-column kanban: Spec & Plan, Implement, Review, and Complete.

Conductor Board also remembers each board state it has observed: it records a
snapshot whenever the aggregate progress changes and shows a progress sparkline and
trend in the header.

The board is strictly read-only over `conductor/`. It does not create, advance, or
archive tracks; it simply makes the current state legible, with a few navigation
affordances (view spec/plan, copy paths, open a worktree in Zed).

## Goals

- Show every worktree and the lifecycle phase of each track within it, one project at a time.
- Offer fast, low-friction actions to jump into the work (spec, plan, Zed).
- Remember registered projects across sessions.
- Remember progress over time: persist board snapshots and show a trend sparkline.

## Non-Goals

- Mutating Conductor state (create/advance/archive tracks).
- Inferring phase from git branch/commit state (Conductor files only).
- Aggregating multiple projects into one board (one project per board).
- Live push updates in v1 (refresh on focus + manual).

## Success Criteria

- Point the board at a Conductor-managed repo and immediately see each worktree's track(s)
  in the correct lifecycle column.
- Open a track's spec/plan and open its worktree in Zed in one or two clicks.
- Add a project once and have it persist across sessions.
