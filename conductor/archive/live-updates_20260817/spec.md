# Spec — Live Board Updates

## Overview

Conductor Board currently refreshes only on tab focus and via a manual **Refresh** button. This track makes the board live: the server watches the `conductor/` directory under every worktree of the **active project** and, on any change, pushes a lightweight `board-changed` event to the SPA over **Server-Sent Events (SSE)**. The client re-fetches `/api/board` (reusing its existing `load()`), so the board reflects edits to `tracks.md`, `plan.md`, `spec.md`, or track folder moves without any manual action.

Live updates are **always on** — no UI toggle in v1. The existing manual **Refresh** button and window-focus refresh remain as fallbacks.

## Functional Requirements

- **FR1 — SSE channel:** The server exposes a streaming endpoint (e.g. `GET /api/events`) that keeps one open connection per connected SPA. It requires an active project; with none selected it does not error-spam the client.
- **FR2 — Watcher scope:** A recursive file watcher watches each worktree's `conductor/` directory of the **active project only**. Changes anywhere under a watched `conductor/` dir trigger consideration for a refresh.
- **FR3 — Debounce:** Incoming change events are coalesced with a **500ms** debounce so a burst of writes yields exactly one refresh.
- **FR4 — Broadcast:** After debounce, the server broadcasts a `board-changed` event to all connected SSE clients. The server stays stateless — it does **not** resolve the new board.
- **FR5 — Project switch:** When the active project changes (`PUT /api/projects/:id/active`), the watcher is torn down and re-registered for the new active project's worktrees.
- **FR6 — Client handling:** On board mount, the SPA opens an `EventSource` to the SSE endpoint. On `board-changed`, it calls its existing `load()` to re-fetch `/api/board`.
- **FR7 — Resilience:** The SSE connection is resilient to drops (EventSource auto-reconnect). The watcher must tolerate missing/unwatchable directories and never crash the server.

## Non-Functional Requirements

- **NFR1 — Read-only safety:** The watcher is passive; it never writes to `conductor/`. Read-only guarantees are preserved.
- **NFR2 — No refresh storms:** Debounce caps throughput to at most one refresh per 500ms burst.
- **NFR3 — Cross-platform (Windows-first):** Uses Bun's cross-platform recursive `fs.watch`; degrades gracefully where recursive watching is unsupported (falls back to the existing manual/focus refresh rather than erroring).
- **NFR4 — Minimal chrome:** No new UI beyond the existing board; live updates are invisible except that the board stays current by itself.

## Acceptance Criteria

- **AC1:** Editing a conductor file (e.g. toggling a plan checkbox, adding a track) in **any** worktree of the active project updates the board without manual Refresh or tab re-focus, within ~1 second.
- **AC2:** Rapid multi-file changes in a burst produce exactly **one** refresh.
- **AC3:** Switching projects tears down the old watcher and starts the new one; board updates reflect the newly active project.
- **AC4:** With no active project, the SSE endpoint does not error-spam; re-selecting a project re-establishes live updates.
- **AC5:** The manual **Refresh** button and window-focus refresh still work.
- **AC6:** Watcher/broadcast logic is unit-testable with fake watches/streams; broader verification follows the project `workflow.md` phase protocol.

## Out of Scope

- Watching non-active / all registered projects.
- Pushing the full board payload over SSE (server stays stateless).
- A user-facing enable/disable toggle.
- Multi-client or cross-device collaboration.
- Live propagation of external project-path changes (adding a registered project already triggers its own scan).