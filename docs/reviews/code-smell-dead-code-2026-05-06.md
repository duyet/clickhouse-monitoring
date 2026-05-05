# Code Smell + Dead Code Scan (2026-05-06)

Window scanned:
- Since last automation run `2026-05-04T21:01:16.982Z`
- Commits: `d7d61f34`, `3f7a905c`, `f08e3d0d`, `4e720750`, `ee10544b`

## Critical
- None with strong repo evidence in this window.

## Warning

1. Dead exported helpers in shared status mapper (confident, fixed)
- Evidence: zero references in app/lib/components for
  - `mapExtendedErrorTypeToStatusCode`
  - `getStatusCodeForError`
  - `isClientErrorCode`
  - `isServerErrorCode`
  - `classifyError` (the shared mapper variant)
- Search command used:
  - `rg -n "mapExtendedErrorTypeToStatusCode|getStatusCodeForError\\b|isClientErrorCode\\b|isServerErrorCode\\b" app lib components --glob '!**/*.test.*' --glob '!**/*.cy.*'`
  - `rg -n "import .*classifyError.*from '@/lib/api/shared'|from '@/lib/api/shared/status-code-mapper'.*classifyError|\\bclassifyError\\b" app lib components --glob '!**/*.test.*' --glob '!**/*.cy.*'`
- Fix:
  - Reduced mapper to only the in-use API: `mapErrorTypeToStatusCode`.
  - Synced barrel exports to remove dead re-exports.
- Files:
  - `lib/api/shared/status-code-mapper.ts`
  - `lib/api/shared/index.ts`

2. Unused import in recently modified chart error component (confident, fixed)
- Evidence:
  - `bun run lint` reported `components/charts/chart-error.tsx:6` unused `ChevronDown` import.
- Fix:
  - Removed `ChevronDown` from the import list.
- File:
  - `components/charts/chart-error.tsx`

## Info

1. Performance regression audit: no hard measurement evidence found in this scan window
- No benchmark traces, profiler captures, or failing performance gates were introduced in the scanned commits.
- Next measurement to add if needed:
  - Record before/after API latency for `/api/v1/data` and `/api/v1/charts/[name]` under representative host/query load.

## Workflow/docs update
- Added a small, repo-grounded note to `CLAUDE.md`:
  - if Biome schema version drifts from CLI version, run `biome migrate` before linting changes.
