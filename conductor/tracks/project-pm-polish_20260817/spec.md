# Spec — Project Management Polish

## Overview

The project-add flow has two rough edges. Adding a path that is already registered
hits the SQLite `UNIQUE` constraint on `projects.path` and surfaces a raw error
(`UNIQUE constraint failed: projects.path`) as a 400 in the UI — unfriendly and
confusing. The first registered project is also not selected automatically, forcing a
manual click before the board can render.

This track makes project adds self-consistent: duplicates are rejected with a clear
"Project already added" message, and the first add auto-activates so the board renders
immediately. It is a read-only-safe, purely backend change; the SPA already reflects the
active project and surfaces API errors without requiring JS changes.

## Functional Requirements

- **FR1 — Friendly duplicate rejection:** `POST /api/projects` with a path already
  registered returns `400` with a clear "Project already added" message instead of a raw
  constraint error, and no duplicate row is inserted.
- **FR2 — Case-insensitive match (Windows-first):** duplicates are detected by comparing
  resolved paths ignoring case, so `C:\Foo` and `c:\foo` are treated as the same project.
  Stored paths keep their original casing; only the comparison is case-insensitive.
- **FR3 — Auto-activate first:** after a successful add, if no project is currently
  active, the new project becomes active. When one is already active, adding another does
  **not** change the selection.
- **FR4 — Frontend behavior:** no required JS changes. The existing error slot surfaces
  the friendly duplicate message, and `refreshProjects()` reflects the newly active
  project so the board loads for the first add.

## Non-Functional Requirements

- Preserve board read-only safety (no new writes to `conductor/`).
- Preserve stored path casing (storage unchanged; only duplicate comparison is
  case-insensitive).
- Keep the DB `UNIQUE` constraint as a safety net.

## Acceptance Criteria

- **AC1:** Re-adding a registered path (optionally with different casing/separators)
  returns `400` with "Project already added" and does not create a second row.
- **AC2:** Adding a valid project when none is active makes it active
  (`activeId == new id`); the board renders without a manual click.
- **AC3:** Adding a valid project while another is active leaves the active project
  unchanged.
- **AC4:** The invalid-path rejection message is unchanged.
- **AC5:** Existing add/remove/setActive tests plus the full suite stay green
  (`bun run typecheck`, `biome check .`, `bun test`).

## Out of Scope

- A file-picker / directory dialog for path entry.
- Auto-cleanup of projects whose path has vanished from disk.
- Dedupe/validation changes on remove.
- Storing normalized (e.g. lowercased) paths — storage keeps original casing.
- Multi-project board aggregation.