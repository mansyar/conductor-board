# Plan — Detached-HEAD + card polish + default port 3002

## Phase 1 — Default port 3002
- [ ] Task: change the default port in `server/src/index.ts` to `process.env.PORT ?? 3002`.
- [ ] Task: update the `/api` proxy target in `web/vite.config.ts` to `http://localhost:3002`.
- [ ] Task: document the deviation in `conductor/tech-stack.md` (3001 → 3002, dated note).
- [ ] Task: manually verify `bun run dev:server` binds 3002 and the Vite proxy reaches it.
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)

## Phase 2 — Detached-HEAD short SHA
- [ ] Task: **Red** — extend `server/src/worktrees.test.ts` so porcelain parsing
      captures the `HEAD <sha>` line on a detached worktree (flows into
      `WorktreeInfo`). Confirm it fails.
- [ ] Task: **Green** — extend `parseWorktreePorcelain` in
      `server/src/worktrees.ts` to record the HEAD sha; add the field to
      `WorktreeInfo` and thread it through `board.ts` → card.
- [ ] Task: **Red** — add a `web/src` helper test for formatting the branch label
      (`detached (<7-char>)` vs plain branch). Confirm it fails.
- [ ] Task: **Green** — implement the label formatter and render
      `detached (<sha>)` on detached cards in `web/src/Board.tsx`.
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)

## Phase 3 — Branch badge layout
- [ ] Task: restructure `TrackCardView` in `web/src/Board.tsx` — branch (or
      detached label) as a distinct badge on its own line; demote the worktree
      path to a quiet subtitle. (JSX layout is exempt from the mandatory-testing
      scope.)
- [ ] Task: visual sanity pass at narrow widths (XL 4-col → single column).
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)

## Phase 4 — Last-modified (relative time)
- [ ] Task: **Red** — extend `server/src/boardService.test.ts`: a track card's
      `lastModifiedMs` equals the newest mtime across its spec/plan/metadata;
      a missing dir yields `null`. Confirm it fails.
- [ ] Task: **Green** — add `readMtimeMs(worktreePath, relPath): Promise<number | null>`
      to `ProjectReads` and `fsProjectReads` (and update fakes in affected test
      files); `loadBoard` computes the max and `board.ts` embeds it on cards.
- [ ] Task: **Red** — add a `web/src` test for a `relativeTime(ms)` formatter
      (`just now`, `2h ago`, `3d ago`). Confirm it fails.
- [ ] Task: **Green** — implement `relativeTime` and render it on cards (omitted
      when `null`, including idle / not-initialized).
- [ ] Task: Phase Verification & Checkpoint (refer to `workflow.md`)