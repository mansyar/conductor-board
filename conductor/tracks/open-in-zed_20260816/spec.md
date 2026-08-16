# Spec — Open in Zed

## Overview

Add the final low-friction action promised by the Conductor Board MVP: **Open in
Zed**. Each track card and idle-lane entry gets a button that tells the server to
spawn the Zed editor on that worktree's path by running `zed <worktree_path>`.

This closes the last unshipped requirement from the original product
definition ("open its worktree in Zed in one or two clicks") and matches the
PRD's `POST /api/open-zed` endpoint and `spawns zed <path>` architecture.

## Functional Requirements

### Server — `POST /api/open-zed`

1.  Accept a JSON body `{ path }` containing an absolute worktree path.
2.  Validate the active project is selected (`409` when none) and exists
    (`404` when the active id has no matching project).
3.  Validate the supplied path resolves to one of the active project's
    worktrees (`404` otherwise), reusing the same containment pattern as
    `/api/file` (`resolveWithin` + `isRealPathWithin`) so no arbitrary path is
    accepted (`403`/`404` on escape or mismatch).
4.  Spawn `zed <path>` as a fire-and-forget child process (do not wait for the
    editor to exit). Resolve the `zed` binary on PATH.
5.  Respond `200` with `{ opened: true, path }` when the spawn succeeds.
6.  Respond `503 { error }` when the spawn fails — most commonly because Zed is
    not installed / not on PATH (spawn `ENOENT`).

### Frontend

1.  Add an **Open in Zed** action to every track card and every idle-lane entry
    (mirroring the "Copy path" affordance).
2.  Clicking it POSTs the card's `worktreePath` to `/api/open-zed`.
3.  On failure, surface a **toast** with the server's error message (e.g.
    "zed not found on PATH"). On success, no confirmation needed.

## Non-Goals

- No configurable Zed command or binary path (no env-var/settings override).
- No waiting for, or detecting, whether the editor actually opened.
- No opening a specific file/line — always the worktree root.
- No non-Windows-specific handling beyond "Zed CLI must be on PATH".
- No mutation of Conductor state; the action is read + navigation only.

## Acceptance Criteria

1.  With an active project, clicking **Open in Zed** on a card or idle entry
    POSTs that worktree's path to `/api/open-zed`, which spawns `zed <path>`
    and returns `200 { opened: true, path }`.
2.  When `zed` is not on PATH, the endpoint returns `503` with a clear message
    and the UI shows a toast with that message.
3.  A path outside the active project's worktrees (or a path-escape attempt) is
    rejected with `403`/`404`.
4.  The action appears on every track card and every idle-lane entry.

## Out of Scope (deferred)

- Configurable Zed command.
- Live push, multi-project aggregation, phase-history analytics (project-wide v1 non-goals).
