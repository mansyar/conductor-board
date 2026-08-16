# Plan — Conductor Board (MVP)

**Track:** `board-mvp_20260816`
**Spec:** [./spec.md](./spec.md)
**Workflow:** `conductor/workflow.md` (TDD for logic-bearing code; phase checkpoints).

---

### Phase 1 — Project Scaffolding *(no logic; no tests)* `[checkpoint: c33c76a]`

- [x] Task: Initialize Bun workspaces monorepo (root `package.json`, `server/`, `web/`) `c33c76a`
- [x] Task: Scaffold ElysiaJS server with a `/health` endpoint `c33c76a`
- [x] Task: Scaffold Vite + React + Tailwind + TypeScript web app `c33c76a`
- [x] Task: Configure Biome (linter + formatter) at workspace root `c33c76a`
- [x] Task: Wire dev scripts (`bun run dev` boots server + web together) `c33c76a`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `c33c76a`

### Phase 2 — Persistence & Project Management `[checkpoint: 1f2e2d1]`

- [x] Task: Define SQLite schema (`projects`, `settings`, `schema_version` via `PRAGMA user_version`) `5e6fc86`
  - [x] Write tests for schema initialization / migration `5e6fc86`
- [x] Task: Implement project repository (add / list / remove / setActive) `8cba505`
  - [x] Write tests for add validation (must be a git repo with `conductor/`) `8cba505`
  - [x] Write tests for CRUD behavior `8cba505`
  - [x] Implement the repository `8cba505`
- [x] Task: Implement `/api/projects` endpoints `ca2c1dc`
  - [x] Write endpoint tests `ca2c1dc`
  - [x] Implement endpoints `ca2c1dc`
- [x] Task: Build frontend project picker + add form + switch `1f2e2d1`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `1f2e2d1`

### Phase 3 — Worktree Discovery & Phase Detection `[checkpoint: 65d0c70]` *(core logic)*

- [x] Task: Parse `git -C <project> worktree list --porcelain` `a647a26`
  - [x] Write tests for porcelain parsing (paths, branches, detached HEAD) `a647a26`
  - [x] Implement parser `a647a26`
- [x] Task: Parse `conductor/tracks.md` entries + checkbox states `0d052ed`
  - [x] Write tests for entry/checkbox parsing (active, complete, idle) `0d052ed`
  - [x] Implement parser `0d052ed`
- [x] Task: Classify phase from checkbox + archive folder location `29ab424`
  - [x] Write tests covering all four stages + archive edge cases `29ab424`
  - [x] Implement classifier `29ab424`
- [x] Task: Compose the board model (columns, cards, idle lane, progress `done/total/pct`) `65d0c70`
  - [x] Write tests (one-card-per-track, multi-track worktree, idle worktree) `65d0c70`
  - [x] Implement composer `65d0c70`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `65d0c70`

### Phase 4 — Board API & File Serving `[checkpoint: 1ea4bee]`

- [x] Task: `GET /api/board` endpoint `417f687`
  - [x] Write tests for response shape `417f687`
  - [x] Implement endpoint `417f687`
- [x] Task: `GET /api/file` with worktree-confined path resolution `1ea4bee`
  - [x] Implement endpoint `1ea4bee`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `1ea4bee`

### Phase 5 — Board UI `[checkpoint: 92f5890]`

- [x] Task: Render four kanban columns + Idle lane `92f5890`
- [x] Task: Build track card (worktree + branch, track name/id, progress) `92f5890`
- [x] Task: Build action affordances (open spec/plan modals, copy path) `92f5890`
- [x] Task: Refresh on tab focus + manual button `92f5890`
- [x] Task: Error/empty/"not initialized" states + styling per product-guidelines `92f5890`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `92f5890`

## Phase: Review Fixes

- [x] Task: Apply review suggestions `34e9ad6`
