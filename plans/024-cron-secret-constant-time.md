# Plan 024: CRON_SECRET is compared in constant time in the health-sweep route

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving to the next step. If
> anything in the "STOP conditions" section occurs, stop and report — do not
> improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ab64addc0..HEAD -- apps/dashboard/src/routes/api/cron/health-sweep.ts apps/dashboard/src/lib/auth/providers/constant-time.ts`
> If either in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `ab64addc0`, 2026-06-22

## Why this matters

The `/api/cron/health-sweep` route authorizes callers by comparing a request-supplied secret to the configured `CRON_SECRET` with plain `===`. String `===` short-circuits on the first differing byte, leaking length and prefix information through response timing — the exact attack the codebase already defends against elsewhere. A constant-time comparator (`secretsMatch`) already exists and is used by the proxy/trusted auth providers; this plan applies it here so the security-critical primitive is consistent across the app.

## Current state

- `apps/dashboard/src/routes/api/cron/health-sweep.ts` — the cron health-sweep route; `isAuthorized()` does the secret check. Excerpt as it exists today (lines 31–43):

```ts
function isAuthorized(request: Request): boolean {
  const bindings = env as Record<string, string | undefined>
  const secret = (bindings.CRON_SECRET ?? process.env.CRON_SECRET)?.trim()
  if (!secret) return true

  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${secret}`) return true

  const url = new URL(request.url)
  if (url.searchParams.get('secret') === secret) return true

  return false
}
```

- `apps/dashboard/src/lib/auth/providers/constant-time.ts` — already exports `secretsMatch(provided: string, expected: string): boolean` (constant-time, length-safe). Excerpt:

```ts
/** Constant-time string secret comparison (UTF-8 encoded). */
export function secretsMatch(provided: string, expected: string): boolean {
  const encoder = new TextEncoder()
  return constantTimeEqual(encoder.encode(provided), encoder.encode(expected))
}
```

- Convention: the proxy/trusted providers import `secretsMatch` from this module. Match that import style. `secretsMatch` returns `false` on length mismatch, so it is safe to call with the request value directly.
- The `if (!secret) return true` behavior (no secret configured ⇒ open) is **intentional** (optional protection for local/dev) — do NOT change it.

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Build+typecheck | `cd apps/dashboard && bun run build` | exit 0, no TS errors |
| Test-only typecheck | `cd apps/dashboard && bun run type-check:test` | exit 0 |
| Tests | `cd apps/dashboard && bun test src/routes/api/cron` | all pass |
| Lint | `bun run lint` | exit 0 |

## Scope

**In scope** (only files you may modify):
- `apps/dashboard/src/routes/api/cron/health-sweep.ts`
- `apps/dashboard/src/routes/api/cron/__tests__/health-sweep.test.ts` (create if absent — check first with `ls apps/dashboard/src/routes/api/cron/__tests__/`)

**Out of scope** (do NOT touch):
- `apps/dashboard/src/lib/auth/providers/constant-time.ts` — already correct; only import from it.
- The `if (!secret) return true` branch — intentional, leave as-is.
- Any other cron or API route.

## Git workflow

- Branch: `security/cron-constant-time-secret`
- One commit; message style (conventional, with co-author trailer seen in `git log`):
  `fix(security): constant-time CRON_SECRET comparison in health-sweep`
  plus a body and `Co-Authored-By: duyetbot <bot@duyet.net>`.
- Commits MUST be signed (`git commit -S`) — `main` enforces `required_signatures`; unsigned commits cannot be merged. Global git config already signs; do NOT pass `gpgsign=false`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Replace the two `===` secret comparisons with `secretsMatch`

In `health-sweep.ts`, add an import:
```ts
import { secretsMatch } from '@/lib/auth/providers/constant-time'
```
(verify the path resolves the same way the proxy provider imports it — `rg "from '@/lib/auth/providers/constant-time'" apps/dashboard/src` shows existing usages; match them.)

Rewrite the two comparisons inside `isAuthorized`:
```ts
  const authHeader = request.headers.get('authorization')
  if (authHeader && secretsMatch(authHeader, `Bearer ${secret}`)) return true

  const url = new URL(request.url)
  const querySecret = url.searchParams.get('secret')
  if (querySecret && secretsMatch(querySecret, secret)) return true
```
Keep the `if (!secret) return true` guard and the final `return false` unchanged.

**Verify**: `cd apps/dashboard && bun run build` → exit 0, no errors. Then `rg -n '=== `\`'Bearer|searchParams.get\('"'"'secret'"'"'\) ===' apps/dashboard/src/routes/api/cron/health-sweep.ts` → no matches (the `===` secret compares are gone).

### Step 2: Add/extend a test asserting both auth paths

If `__tests__/health-sweep.test.ts` exists, add cases; else create it modeled after an existing route test (find one: `rg -l "describe\(" apps/dashboard/src/routes/api/**/__tests__/*.test.ts | head`). Cover, using `bun:test`:
- valid `Authorization: Bearer <secret>` → authorized (call the handler or export `isAuthorized` if not exported; if it is not exported, test via the route handler's 401 vs non-401 response).
- valid `?secret=<secret>` query → authorized.
- wrong secret (both header and query) → 401.
- no `CRON_SECRET` set → authorized (open).

If `isAuthorized` is not exported, prefer testing the exported route handler's Response status rather than exporting internals — do NOT widen the module's public API just for the test unless an existing route test in this repo does so.

**Verify**: `cd apps/dashboard && bun test src/routes/api/cron` → all pass. Then `cd apps/dashboard && bun run type-check:test` → exit 0.

## Test plan

- New/extended `health-sweep.test.ts` covering: authorized-by-header, authorized-by-query, rejected-wrong-secret, open-when-unset.
- Structural pattern: model after an existing `routes/api/**/__tests__/*.test.ts`.
- Verification: `cd apps/dashboard && bun test src/routes/api/cron` → all pass including the new cases.

## Done criteria

- [ ] `cd apps/dashboard && bun run build` exits 0
- [ ] `cd apps/dashboard && bun run type-check:test` exits 0
- [ ] `cd apps/dashboard && bun test src/routes/api/cron` passes, with new auth tests present
- [ ] `bun run lint` exits 0
- [ ] `secretsMatch` is imported and used for BOTH the header and query comparisons; no `===` against the secret remains in `health-sweep.ts`
- [ ] `git status` shows only the two in-scope files changed
- [ ] `plans/README.md` Run-2 status row for 024 updated

## STOP conditions

Stop and report (do not improvise) if:
- The `isAuthorized` excerpt in "Current state" no longer matches the live file.
- `secretsMatch` is no longer exported from `constant-time.ts` (its signature changed).
- A verification command fails twice after a reasonable fix.
- Making the test pass appears to require exporting internals or touching an out-of-scope file.

## Maintenance notes

- If a third secret source is added to the cron route, it must also use `secretsMatch`, not `===`.
- Reviewer should confirm the `(!secret) return true` open-by-default branch is preserved (removing it would break dev/local cron without a configured secret).
