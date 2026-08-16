# Plan: Render spec/plan as Markdown (+ land pending cleanup)

Track: `markdown-render_20260817`

## Phase 1 — Land pending cleanup

- [x] Task: Verify the workspace baseline (run `bun test`; expect green).
- [x] Task: Diff-review the pending edits in `server/src/app.ts` (Biome format fix) and `server/src/appOpenZed.test.ts` (fixture refactor) to confirm they are behavior-neutral.
- [x] Task: Commit the cleanup with a conventional message, e.g. `style(server): normalize worktree resolution formatting` / `refactor(test): hoist worktree fixture init` (single commit is acceptable; keep message descriptive).
- [x] Task: Attach a git note summarizing the cleanup to the commit.
- [x] Task: Record the 7-char commit SHA here and mark this task complete.

## Phase 2 — Document stack change (before implementation)

- [x] Task: Update `conductor/tech-stack.md` Frontend section to record the added deps: `marked`, `dompurify`, `highlight.js`, `marked-highlight` (with a dated note per workflow).
- [x] Task: Commit the tech-stack update (`docs`).

## Phase 3 — Add dependencies + render utility (TDD)

- [x] Task: Write failing tests for a new `web/src/renderMarkdown.ts` utility (logic-bearing): markdown -> safe HTML, `<script>` stripped, fenced code blocks highlighted.
- [x] Task: Install deps in the `web` workspace: `marked`, `marked-highlight`, `dompurify`, `highlight.js`.
- [x] Task: Implement `renderMarkdown(source: string): string` using marked + marked-highlight + DOMPurify; register the board-dark highlight theme.
- [x] Task: Run `bun test` on the web package; make tests pass (>80% on logic-bearing code).
- [x] Task: Commit the render utility + deps (e.g. `feat(web): add sanitized markdown renderer`).

## Phase 4 — Wire rendering into the Spec/Plan modal

- [x] Task: Update `FileModal` in `web/src/Board.tsx` to render `renderMarkdown(content)` via dangerouslySetInnerHTML; keep the existing header, close, loading, and error states.
- [x] Task: Import the highlight.js theme CSS in the app entry (`main.tsx` or `index.css`).
- [x] Task: Confirm `container/prop-types` / lint cleanliness and that JSX-only changes carry no test burden.
- [x] Task: Commit the UI change (`feat(web): render spec/plan markdown in modal`).

## Phase 5 — Verify & checkpoint

- [x] Task: Run the full suite (`bun test`), `bun run typecheck`, and `biome check .`; fix any issues.
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) — propose manual verification (open a spec/plan, confirm rendering + highlighting + sanitized script) and await explicit approval.
- [x] Task: Mark track complete in registry and commit the plan/index updates.

[checkpoint: `405f851`]

_Phase 1 commit: `d3fa97d`_

## Phase: Review Fixes
- [x] Task: Apply review suggestions b9722c8
