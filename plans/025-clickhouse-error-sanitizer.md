# Plan 025: API responses sanitize ClickHouse error details instead of leaking them to clients

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving on. If anything in "STOP
> conditions" occurs, stop and report — do not improvise. When done, update the
> status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ab64addc0..HEAD -- apps/dashboard/src/routes/api/v1/actions.ts apps/dashboard/src/lib/api/error-handler`
> If any in-scope file changed since this plan was written, compare the "Current
> state" excerpts against live code before proceeding; on mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `ab64addc0`, 2026-06-22

## Why this matters

Multiple API routes return raw ClickHouse `error.message` text directly in client HTTP responses. ClickHouse error strings reveal server internals — table/column existence, version-specific feature support, permission state, query-parser details — which lets a caller map the backend through failed requests. The fix is one small utility that returns a stable, classified message to the client while the full error is still logged server-side. This is defensive maintenance: classify-and-redact at the response boundary, keep diagnostics in logs.

This plan starts with the **confirmed, highest-traffic leak** (`routes/api/v1/actions.ts`) and the shared error-response builder, establishing the sanitizer + pattern. Extending it to the other routes is listed as deferred follow-up so this plan stays small and verifiable.

## Current state

- `apps/dashboard/src/routes/api/v1/actions.ts` — kill-query / optimize-table / query-settings actions. Confirmed leak sites (interpolate raw `error.message` into the client `message`):
  - line 93: `message: \`Failed to kill query ${queryId}: ${error.message}\``
  - line 129: `message: \`Failed to optimize table ${table}: ${error.message}\``
  - line 154: `message: \`Failed to get query settings ${queryId}: ${error.message}\``
  Each is preceded by `ErrorLogger.logError(new Error(error.message), { ... })` (lines 86/122/147) — so the full error is ALREADY logged server-side; only the client response needs redaction.
- `apps/dashboard/src/lib/api/error-handler/error-response-builder.ts` — the shared builder (`createErrorResponse`, `createValidationError`, `createNotFoundError`, `getStatusCodeForErrorType`). It already has unit tests at `apps/dashboard/src/lib/api/error-handler/__tests__/error-response-builder.test.ts` — match that test file's structure.
- Convention: error *types* are an existing enum (`ApiErrorType` — grep `rg "ApiErrorType" apps/dashboard/src/lib/api`). The sanitizer should return a generic message keyed off classification, never the raw ClickHouse text.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Build+typecheck | `cd apps/dashboard && bun run build` | exit 0 |
| Test-only typecheck | `cd apps/dashboard && bun run type-check:test` | exit 0 |
| Tests | `cd apps/dashboard && bun test src/lib/api/error-handler src/routes/api/v1` | all pass |
| Lint | `bun run lint` | exit 0 |

## Scope

**In scope** (only files you may modify/create):
- `apps/dashboard/src/lib/api/error-handler/sanitize-error.ts` (create)
- `apps/dashboard/src/lib/api/error-handler/__tests__/sanitize-error.test.ts` (create)
- `apps/dashboard/src/routes/api/v1/actions.ts` (apply sanitizer to the 3 leak sites)
- `apps/dashboard/src/routes/api/v1/__tests__/actions.test.ts` (create or extend — check first)

**Out of scope** (do NOT touch in this plan):
- The other leaking routes (`cluster-topology.ts`, `explain.ts`, `findings.ts`, `conversations.ts`, `health.ts`, MCP tools) — these are deferred follow-up (see Maintenance notes). Doing them here would make the diff unreviewable.
- `ErrorLogger.logError` calls — they correctly log the full error; keep them.
- Any change to HTTP status codes — only the human-readable `message` string changes.

## Git workflow

- Branch: `security/clickhouse-error-sanitizer`
- Commit message: `fix(security): redact ClickHouse error details from action API responses` + `Co-Authored-By: duyetbot <bot@duyet.net>`.
- Commits MUST be signed (`git commit -S`); `main` enforces `required_signatures`. Do NOT disable signing.
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Create the sanitizer utility

Create `sanitize-error.ts` exporting `sanitizeClickHouseError(raw: string): string`. Behavior:
- Classify the raw message into a small set of safe buckets by case-insensitive substring (e.g. contains `not found`/`doesn't exist` → "Resource not found"; contains `access denied`/`not enough privileges` → "Permission denied"; contains `timeout`/`timed out` → "Operation timed out"; contains `syntax`/`cannot parse` → "Invalid query"; else → "Operation failed").
- NEVER return any substring of `raw` (no echoing the original). Keep the bucket list short and return a constant per bucket.
- Pure function, no I/O. Export the bucket constants too so tests can assert against them.

**Verify**: `cd apps/dashboard && bun run build` → exit 0.

### Step 2: Unit-test the sanitizer

Create `__tests__/sanitize-error.test.ts` (model after `error-response-builder.test.ts`). Cover: each bucket maps a representative raw message to its constant; an unknown message maps to the generic fallback; the output never contains the raw input (assert `expect(out).not.toContain(<a distinctive token from raw>)`).

**Verify**: `cd apps/dashboard && bun test src/lib/api/error-handler` → all pass; `cd apps/dashboard && bun run type-check:test` → exit 0.

### Step 3: Apply the sanitizer at the 3 `actions.ts` leak sites

Replace the interpolated `error.message` in the client `message` with the sanitized value, keeping the action context prefix. Example for the kill-query site:
```ts
message: `Failed to kill query ${queryId}: ${sanitizeClickHouseError(error.message)}`,
```
Do the same at lines 129 and 154. Leave the `ErrorLogger.logError(new Error(error.message), ...)` calls untouched (full error still logged). Add the import for `sanitizeClickHouseError`.

**Verify**: `rg -n 'error\.message' apps/dashboard/src/routes/api/v1/actions.ts` → the only remaining `error.message` references are inside `ErrorLogger.logError(...)` (server-side logging), NOT inside any `message:` returned to the client. `cd apps/dashboard && bun run build` → exit 0.

### Step 4: Test the action routes don't echo raw errors

Create/extend `routes/api/v1/__tests__/actions.test.ts` (check `ls apps/dashboard/src/routes/api/v1/__tests__/` first; model after a sibling route test). With a mocked `fetchData`/client that throws an error whose message contains a distinctive token (e.g. `"system.secret_table does not exist"`), invoke each action handler and assert the response `message` does NOT contain the distinctive token (`system.secret_table`) and DOES contain the bucket message ("Resource not found").

**Verify**: `cd apps/dashboard && bun test src/routes/api/v1` → all pass; `cd apps/dashboard && bun run type-check:test` → exit 0.

## Test plan

- `sanitize-error.test.ts`: bucket classification + no-echo guarantee.
- `actions.test.ts`: each of the 3 handlers redacts a planted secret token from the client response while preserving context + status code.
- Pattern: `error-response-builder.test.ts` (sanitizer), a sibling `routes/api/v1/__tests__` route test (handlers).

## Done criteria

- [ ] `cd apps/dashboard && bun run build` exits 0
- [ ] `cd apps/dashboard && bun run type-check:test` exits 0
- [ ] `cd apps/dashboard && bun test src/lib/api/error-handler src/routes/api/v1` passes; new tests present
- [ ] `bun run lint` exits 0
- [ ] No client-facing `message:` in `actions.ts` interpolates raw `error.message` (only `ErrorLogger.logError` does)
- [ ] `git status` shows only in-scope files changed
- [ ] `plans/README.md` Run-2 status row for 025 updated

## STOP conditions

- The `actions.ts` leak-site excerpts no longer match the live file.
- `ApiErrorType` / the error-response-builder shape changed enough that classification can't be expressed cleanly — report and propose an alternative.
- A verification fails twice after a reasonable fix.
- You find a leak site that needs an out-of-scope file changed to fix — note it for the follow-up, don't expand scope.

## Maintenance notes

- **Deferred follow-up (a separate plan/PR)**: apply `sanitizeClickHouseError` to the other confirmed leak sites — `routes/api/v1/cluster-topology.ts` (158/164/283), `explain.ts` (117/139/283/318), `findings.ts` (209), `conversations.ts` (137/151/299/322), `routes/api/health.ts` (71–87), and the MCP tools in `packages/mcp-server/src/tools/*` (queries/tables/explore-table-schema/databases/performance/merges). Consider centralizing in `error-response-builder.ts` so any `createErrorResponse` automatically sanitizes.
- Reviewer should confirm full errors are still reaching server logs (the `ErrorLogger.logError` calls), so observability isn't lost.
- If a new error bucket is needed (e.g. a distinct user-facing message for quota errors), add it to the sanitizer's bucket list with a test — never by passing the raw message through.
