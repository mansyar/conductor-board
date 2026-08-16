# Plan — Conductor Board (MVP)

**Track:** `board-mvp_20260816`
**Spec:** [./spec.md](./spec.md)
**Workflow:** `conductor/workflow.md` (TDD for logic-bearing code; phase checkpoints).

---

### Phase 1 — Project Scaffolding *(no logic; no tests)*

- [ ] Task: Initialize Bun workspaces monorepo (root `package.json`, `server/`, `web/`)
- [ ] Task: Scaffold ElysiaJS server with a `/health` endpoint
- [ ] Task: Scaffold Vite + React + Tailwind + TypeScript web app
- [ ] Task: Configure Biome (linter + formatter) at workspace root
- [ ] Task: Wire dev scripts (`bun run dev` boots server + web together)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 2 — Persistence & Project Management

- [ ] Task: Define SQLite schema (`projects`, `settings`, `schema_version` via `PRAGMA user_version`)
  - [ ] Write tests for schema initialization / migration
- [ ] Task: Implement project repository (add / list / remove / setActive)
  - [ ] Write tests for add validation (must be a git repo with `conductor/`)
  - [ ] Write tests for CRUD behavior
  - [ ] Implement the repository
- [ ] Task: Implement `/api/projects` endpoints
  - [ ] Write endpoint tests
  - [ ] Implement endpoints
- [ ] Task: Build frontend project picker + add form + switch
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 3 — Worktree Discovery & Phase Detection *(core logic)*

- [ ] Task: Parse `git -C <project> worktree list --porcelain`
  - [ ] Write tests for porcelain parsing (paths, branches, detached HEAD)
  - [ ] Implement parser
- [ ] Task: Parse `conductor/tracks.md` entries + checkbox states
  - [ ] Write tests for entry/checkbox parsing
  - [ ] Implement parser
- [ ] Task: Classify phase from checkbox + archive folder location
  - [ ] Write tests covering all four stages + archive edge cases
  - [ ] Implement classifier
- [ ] Task: Compose the board model (columns, cards, idle lane, progress `done/total/pct`)
  - [ ] Write tests (one-card-per-track, multi-track worktree, idle worktree)
  - [ ] Implement composer
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 4 — Board API & File Serving

- [ ] Task: `GET /api/board` endpoint
  - [ ] Write tests for response shape
  - [ ] Implement endpoint
- [ ] Task: `GET /api/file` with worktree-confined path resolution
  - [ ] Write tests for confinement (deny anything outside registered worktrees)
  - [ ] Implement endpoint
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 5 — Board UI

- [ ] Task: Render four kanban columns + Idle lane
- [ ] Task: Build track card (worktree + branch, track name/id, progress)
- [ ] Task: Build action affordances (open spec/plan modals, copy path)
- [ ] Task: Refresh on tab focus + manual button
- [ ] Task: Error/empty/"not initialized" states + styling per product-guidelines
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
