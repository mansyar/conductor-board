# PRD — Conductor Board

> A visual kanban board for tracking which Conductor lifecycle phase each of your
> development worktrees is in, for a single project at a time.

---

## 1. Problem Statement

When working across multiple **git worktrees** on a project that follows the
**Conductor** methodology, it is hard to see at a glance where each worktree stands
in the development lifecycle (which track is being planned, implemented, reviewed,
or is complete). The state exists in `conductor/` files, but it is scattered across
tracks and — because each worktree has its own checkout — across worktrees.

**Conductor Board** surfaces that state as a single kanban board.

---

## 2. Goals

- Show, for one project, every worktree and the lifecycle phase of each track within it.
- Classify tracks into four columns: **Spec & Plan → Implement → Review → Complete**.
- Make idle worktrees (no active track) visible but out of the way.
- Offer low-friction actions: view spec/plan, copy paths, open a worktree in Zed.
- Allow adding/switching between projects, remembering them across sessions.

## 3. Non-Goals

- Does **not** manage Conductor state itself (no creating tracks, no advancing status,
  no archiving). The board is read-only over `conductor/`.
- Does **not** infer phase from git commit/branch state; only from Conductor files.
- Does **not** become a multi-project "command center" aggregation; one board = one project.
- No live push updates in v1 (refresh is on-focus + manual).

---

## 4. Terminology

| Term | Meaning |
|---|---|
| **Project** | A git repository registered in the board (identified by its main-worktree path). |
| **Worktree** | A git linked worktree of the project, including the main worktree. |
| **Track** | A Conductor feature/bug/chore with a folder under `conductor/tracks/<id>/` (later `conductor/archive/<id>/`). |
| **Lifecycle stage** | One of `Spec & Plan`, `Implement`, `Review`, `Complete` (see §6). |

---

## 5. Architecture Overview

- **Runtime:** Bun
- **Backend:** ElysiaJS — serves a JSON API + the built frontend as static files.
- **Persistence:** `bun:sqlite` (built-in). Minimal schema, migration-friendly (§8).
- **Frontend:** React + Tailwind SPA rendering the kanban.
- **Data source:** Conductor files only, read from **each worktree's own checkout**.
- **Refresh model:** re-scan on tab focus + explicit "Refresh" button.

```
[Browser SPA] ──HTTP──▶ [ElysiaJS API] ──reads──▶ conductor/ files (per worktree)
                             │
                             ├──▶ git worktree list (discovery)
                             ├──▶ bun:sqlite (projects + settings)
                             └──▶ spawns `zed <path>` (open-in-Zed action)
```

---

## 6. Phase Detection Logic (canonical)

For each worktree, parse its own `conductor/tracks.md` and inspect track folders.

A **track's stage** is determined by its registry checkbox and folder location:

| Stage | Rule |
|---|---|
| **Spec & Plan** | Track listed in `tracks.md` with `[ ]`, folder under `conductor/tracks/`. |
| **Implement** | Track listed in `tracks.md` with `[~]`. |
| **Review** | Track listed in `tracks.md` with `[x]`, folder **still** under `conductor/tracks/`. |
| **Complete** | Track folder present under `conductor/archive/` (regardless of whether `tracks.md` still lists it). |

**Idle worktree:** a worktree whose `tracks.md` has no track in Spec & Plan / Implement / Review.

> **Note (archive behavior):** the canonical `conductor-review` skill moves a track to
> `conductor/archive/` **and** removes it from `tracks.md`, but the user's workflow
> *sometimes* keeps the `[x]` entry in `tracks.md` with a link pointing into `archive/`.
> The "Complete" rule above (folder present under `archive/`) is robust to **both** cases.

### 6.1 Worktree ↔ Track association

Worktrees and tracks are **not strictly linked**. Association is derived from each
worktree's own `tracks.md`: whichever track(s) it declares in an active state are
rendered as cards for that worktree.

- **One card per track** — a worktree with multiple active (`[~]`) tracks produces
  multiple cards, one in each relevant column.
- A worktree contributes at most one entry to the **Idle lane** (only if it has no
  active track).

### 6.2 Conductor path resolution

- Standard defaults: registry `conductor/tracks.md`, tracks dir `conductor/tracks/`,
  archive dir `conductor/archive/`.
- Nice-to-have: honor `conductor/index.md` if it relinks these paths; otherwise fall
  back to defaults.

---

## 7. Functional Requirements

### 7.1 Board rendering

- **Four kanban columns** (left → right): `Spec & Plan`, `Implement`, `Review`, `Complete`.
- **Idle lane** below/left of the columns listing worktrees with no active track.
- Board shows **one project at a time**; a project picker allows switching.

### 7.2 Card content

Each track card displays:
1. **Worktree + branch (primary emphasis)** — the worktree path (short name) and current git branch.
2. **Track name/id** — the track's description or short id.
3. **Plan task progress** — `done/total` and a small percentage from `plan.md` checkboxes (`[x]` / `[~]` vs `[ ]`).
4. **Action affordances** — see §7.4.

Idle-lane entries show the worktree + branch, and that it has no active track.

### 7.3 Worktree discovery

- `git -C <project> worktree list --porcelain` to enumerate worktree paths and branches.
- Detached-HEAD worktrees are handled (branch shown as `detached (<sha>)`).
- A worktree with no `conductor/` directory is flagged as "not initialized" rather than erroring.

### 7.4 Actions (read + navigable)

Per track card / idle entry:

| Action | Behavior |
|---|---|
| **Open spec** | Fetch and render `spec.md` content in an inline modal (markdown). |
| **Open plan** | Fetch and render `plan.md` content in an inline modal (markdown). |
| **Copy path** | Copy the worktree (or track) path via the browser Clipboard API. |
| **Open in Zed** | Server spawns `zed <worktree_path>` (Zed CLI must be on PATH). |

### 7.5 Project management

- List persisted projects; **add** a project by path, **remove** a project, **switch**
  the active one.
- Adding a project validates the path is a git repo and looks for `conductor/`.

### 7.6 Refresh

- Auto re-scan when the browser tab regains focus.
- Manual "Refresh" button forces an immediate re-scan.

---

## 8. Data Model (SQLite)

Minimal now, migration-friendly for future history.

```sql
-- Registered projects
CREATE TABLE projects (
  id              INTEGER PRIMARY KEY,
  name            TEXT NOT NULL,
  path            TEXT NOT NULL UNIQUE,   -- absolute main-worktree path
  created_at      TEXT NOT NULL,
  last_opened_at  TEXT
);

-- UI preferences (populate as needed)
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- Future (NOT in v1): phase history / analytics
-- CREATE TABLE snapshots (
--   project_id   INTEGER,
--   track_id     TEXT,
--   stage        TEXT,
--   observed_at  TEXT
-- );
```

- Use a simple `schema_version` (e.g., a `_meta` key or a `PRAGMA user_version`) so
  future columns/tables can be added without a rewrite.

---

## 9. API Surface (ElysiaJS)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/projects` | List projects (+ which is active). |
| POST | `/api/projects` | Add a project `{ path }`; validates and returns the record. |
| DELETE | `/api/projects/:id` | Remove a project. |
| PUT | `/api/projects/:id/active` | Set the active project. |
| GET | `/api/board` | Full board data for the active project (columns, cards, idle lane). |
| GET | `/api/file` | Read a conductor file by resolved path (serves spec/plan markdown). |
| POST | `/api/open-zed` | Spawn `zed <path>` for a worktree. |

- `/api/board` response shape: `{ columns: [ { stage, cards: [...] } × 4 ], idle: [ ... ] }`.
- Card shape: `{ worktree, branch, trackId, trackName, progress: {done,total,pct}, stage, paths: {...} }`.

---

## 10. Non-Functional Requirements

- **Read-only safety:** the board never writes to `conductor/`. File reads and `git worktree list` only.
- **Performance:** a board scan completes fast for a typical single-digit worktree count; reading is lazy (spec/plan fetched only on demand).
- **Error handling:** missing `conductor/`, unreadable files, and a non-repo project path degrade gracefully with a visible message rather than crashing the board.
- **Path safety:** `/api/file` and `/api/open-zed` must resolve paths within a registered project's worktrees only (no arbitrary filesystem access).
- **Cross-platform:** Windows-first (target environment), but avoid hardcoded path separators where Bun abstracts them.

---

## 11. Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Bun |
| Backend | ElysiaJS |
| DB | `bun:sqlite` |
| Frontend | React + Tailwind CSS |
| Build/Dev | Bun scripts (`bun run dev`, `bun run build`) |

---

## 12. Out of Scope (v1)

- Mutating Conductor state (create/advance/archive tracks).
- Live push via file watcher (deferred; on-focus + manual only).
- Multi-project aggregate dashboard (one project per board).
- Collaboration / remote access / auth (local single-user tool).
- Phase-history analytics (schema leaves room, not implemented).

---

## 13. Assumptions & Open Questions

1. **Zed CLI on PATH** — "open in Zed" assumes `zed <path>` is invokable from the server process.
2. **Archive detection** — "Complete" = folder under `conductor/archive/` (robust to both
   "removed from tracks.md" and "kept as `[x]` with archive link"). Verify against the
   user's real repos during implementation.
3. **Multiple active tracks** — rendered one card per track; no special aggregation.
4. **Conductor path customization** — standard defaults assumed; `conductor/index.md`
   relinking is a nice-to-have, not required.

## 14. Future Considerations

- File-watcher live updates.
- Phase-history snapshots + a simple timeline/trend view (schema already anticipates this).
- Aggregate across multiple projects.
- Inline actions to push status forward (once read-only is well-established).
