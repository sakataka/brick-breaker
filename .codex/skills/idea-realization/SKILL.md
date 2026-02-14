---
name: idea-realization
description: Implement one gameplay idea at a time from docs/idea-list.md in this Brick Breaker repository. Use when the user asks to realize an idea with end-to-end flow: select target idea, design implementation plan, implement code, add or update tests, run quality gates, update docs/progress, and commit.
---

# Idea Realization

Execute one idea from `docs/idea-list.md` through a fixed workflow with progress tracking.

## Use this workflow

1. Identify target idea.
2. Write implementation plan.
3. Implement code.
4. Add or update tests.
5. Run verification commands.
6. Update docs and progress.
7. Commit changes.

## Target selection rules

1. Read `docs/idea-list.md`.
2. Read `docs/idea-progress.md` if it exists.
3. If user specifies an ID (for example `BB-IDEA-03`), implement that ID.
4. If user does not specify an ID, pick the first TODO in priority order `P1 -> P2 -> P3`.
5. Implement only one idea per commit unless user explicitly requests batch implementation.

## Progress tracking rules

1. Keep progress in `docs/idea-progress.md`.
2. Use the table format in `references/progress-template.md`.
3. Track each idea with status: `TODO | IN_PROGRESS | DONE | BLOCKED`.
4. Update one row when work starts and again when work ends.
5. Record commit hash for DONE rows.

## Implementation rules

1. Start with the idea's `最小導入版` in `docs/idea-list.md`.
2. Keep architecture boundaries:
   - Rules: `src/game/gamePipeline.ts`, `src/game/roundSystem.ts`
   - Physics: `src/game/physicsCore.ts`, `src/game/physicsApply.ts`
   - Items: `src/game/itemRegistry.ts`, `src/game/itemSystem.ts`
   - UI: `src/game/renderPresenter.ts`, `src/ui/overlay.ts`, `src/game/hud.ts`
   - Audio: `src/audio/audioDirector.ts`, `src/audio/sfx.ts`, `src/audio/bgmCatalog.ts`
3. Avoid unrelated refactors during idea implementation.
4. Preserve existing behavior outside the selected idea scope.

## Testing and verification rules

Run in this order after implementation:

1. `bun run check`
2. `bun test`
3. `bun run e2e`

If e2e cannot run due environment constraints, report the reason clearly and continue with passed gates.

## Documentation update rules

1. Update `docs/idea-progress.md` status and notes.
2. Update `README.md` only when user-facing behavior changes.
3. Update `docs/architecture.md` only when module boundaries or data flow change.
4. Keep `docs/idea-list.md` as proposal source; do not delete implemented ideas.

## Commit rules

1. Create one commit per idea.
2. Use commit message format:
   - `feat(idea): implement BB-IDEA-XX <short-slug>`
3. Include tests and docs updates in the same commit.

## Response contract

Always report:

1. Implemented idea ID and name.
2. Files changed.
3. Test command results.
4. Updated progress status.
5. Commit hash (if committed).
