# Code Smell and Dead Code Review - 2026-05-07

Scope:
- Since last automation run timestamp in prompt: `2026-05-05T21:01:49.337Z`
- Commits scanned: `1af14f7c049952d69b699c83296d02162b1f4c50`
- Files changed in scope:
  - `lib/api/shared/status-code-mapper.ts`
  - `lib/api/shared/index.ts`
  - `components/charts/chart-error.tsx`
  - `CLAUDE.md`
  - `docs/reviews/code-smell-dead-code-2026-05-06.md`

## Findings

### Critical
- None.

### Warning
- None in the changed-code scope.

### Info
- No new dead code candidates found in recently modified non-test files.
- Reference evidence:
  - `mapErrorTypeToStatusCode` is referenced by API routes:
    - `app/api/v1/data/route.ts:26`
    - `app/api/v1/explain/route.ts:24`
  - Shared export retained in `lib/api/shared/index.ts:17`.

## Potential Bugs Since Last Run
- No concrete new bug signals found in the scoped commit diff.
- No failing CI signal tied to post-run commits in this window.

## Performance Regression Audit
- No performance regression evidence found in the scoped commit.
- Uncertainty: no fresh perf traces/benchmarks were added in this window.
- If needed next run: compare `bun run bench:wasm` and chart render timings on a fixed dataset before/after commit SHA.

## Notes
- Workspace lint still reports pre-existing warnings in `components/charts/chart-empty.tsx` (unused import and parameter), but that file is outside this run's changed-file scope.
