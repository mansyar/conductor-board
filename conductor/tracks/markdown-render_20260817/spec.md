# Track: Render spec/plan as Markdown (+ land pending cleanup)

## Overview

The board's Spec/Plan modals currently display a track's `spec.md` / `plan.md`
content as a raw `<pre>` block of plain text (see `web/src/Board.tsx`,
`FileModal`). The product definition (PRD §7.4) specifies that these files
should be *rendered* as markdown inside the inline modal. This track closes
that gap: fetched markdown is parsed, sanitized, and rendered as styled HTML
with syntax-highlighted code blocks.

As part of this track we also land pending, uncommitted edits left in the
workspace after the previous track: a Biome formatting fix in
`server/src/app.ts` and a test-fixture refactor in
`server/src/appOpenZed.test.ts`. These are clean, already-tested changes that
should enter history (avoiding untracked drift) before feature work begins.

## Functional Requirements

### FR1 — Rendering
- The Spec and Plan modals render their markdown content as styled HTML instead
  of a raw `<pre>`.
- Parsing is done client-side with **marked**.
- Rendered output is sanitized with **DOMPurify**.
- Fenced code blocks get syntax highlighting via **highlight.js** (auto-detected
  language), with a dark theme matching the board.
- The existing modal shell (header, close button, loading / error states) and
  the `/api/file` text contract are unchanged.

### FR2 — Cleanup
- The pending uncommitted changes in `server/src/` (`app.ts` formatting,
  `appOpenZed.test.ts` fixture refactor) land as a proper commit with a
  conventional message.
- No functional behavior changes from the cleanup; the suite stays green.

## Non-Functional Requirements

- Sanitization: raw HTML in a `conductor` file (e.g. `<script>`) must not
  execute in the modal. DOMPurify is the enforced boundary.
- Dependencies are limited to `marked`, `dompurify`, `highlight.js`, and
  `marked-highlight` in the `web` workspace.
- Rendering must not regress loading or error handling for missing/unreadable
  files.
- New dependency usage is recorded in `conductor/tech-stack.md` before
  implementation (per `conductor/workflow.md`).

## Acceptance Criteria

1. Opening a track's Spec or Plan shows rendered markdown (headings, lists,
   emphasis, links, tables) rather than raw text.
2. A fenced code block in a file is syntax-highlighted with the board's dark
   theme.
3. A file containing an embedded `<script>...</script>` renders with that tag
   inert (stripped/sanitized).
4. The pending `app.ts` + `appOpenZed.test.ts` edits are committed; the full
   test suite passes (including the updated `appOpenZed.test.ts`).
5. `conductor/tech-stack.md` documents the added web dependencies.
6. `biome check .` and `bun run typecheck` pass.

## Out of Scope

- Editing or advancing track state from within the modal.
- Server-side markdown rendering or changes to the `/api/file` response.
- Syntax-highlighting themes beyond the single board-dark theme.
- Rendering markdown anywhere other than the Spec/Plan modals.
- File-watcher live updates, phase-history, or multi-project board.
