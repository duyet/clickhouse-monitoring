# Plan 027: Conversations can be exported (JSONL) from any storage backend

> **Executor instructions**: This is a **design-then-implement** plan. Step 0 is an
> investigation whose output (a short interface map) gates the rest. Follow steps
> in order, run every verification command, and honor STOP conditions. When done,
> update the status row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ab64addc0..HEAD -- apps/dashboard/src/lib/conversation-store`
> If the directory changed since this plan was written, re-do Step 0's interface
> map against live code before writing any export code.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `ab64addc0`, 2026-06-22

## Why this matters

The app has **five** conversation storage backends — `d1-store.ts`, `postgres-store.ts`, `browser-store.ts`, `memory-store.ts`, `agentstate-store.ts` (all under `apps/dashboard/src/lib/conversation-store/`). Every one can read and write conversations, but there is **no export path** anywhere in the codebase. That makes conversations un-portable: a user on D1 who wants to move to Postgres, take a backup, or audit history has no supported way out. This is a one-directional surface asymmetry (write without export) that the existing store interface makes cheap to close. JSONL (one conversation per line, each line valid JSON) is streamable and backend-agnostic.

This plan is scoped as a spike-then-implement because the export must go through the *common* store read interface, which Step 0 pins down before any code is written. (Plan author deliberately did not inline store excerpts — the executor maps the live interface in Step 0 so the plan can't drift on internal shapes.)

## Current state (to be confirmed in Step 0)

- `apps/dashboard/src/lib/conversation-store/` — 5 backend implementations plus (likely) a shared type/interface module and a store-selection entry point. The audit confirmed all 5 expose read/write; none expose export.
- API routes for conversations live at `apps/dashboard/src/routes/api/v1/conversations.ts` (read/write today).
- Convention to match: existing route handlers in `routes/api/v1/*` for request validation, auth (`authorize*`), and `ApiResponse` shaping; existing store tests for the test pattern.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Build+typecheck | `cd apps/dashboard && bun run build` | exit 0 |
| Test-only typecheck | `cd apps/dashboard && bun run type-check:test` | exit 0 |
| Tests | `cd apps/dashboard && bun test src/lib/conversation-store src/routes/api/v1` | all pass |
| Lint | `bun run lint` | exit 0 |

## Scope

**In scope** (create/modify):
- `apps/dashboard/src/lib/conversation-store/export.ts` (create) — backend-agnostic export over the common interface.
- `apps/dashboard/src/lib/conversation-store/__tests__/export.test.ts` (create).
- `apps/dashboard/src/routes/api/v1/conversations-export.ts` (create) — or extend `conversations.ts` with an export sub-route IF that matches the repo's routing convention (decide in Step 0).
- Test for the route.

**Out of scope**:
- Changing any existing store backend's read/write behavior.
- Import (the reverse direction) — separate future plan.
- Any UI/download button — this plan delivers the API + lib only. (Note it as follow-up.)
- Adding a new dependency — JSONL needs none.

## Git workflow

- Branch: `feat/conversation-export`
- Commits: conventional, e.g. `feat(conversations): JSONL export across storage backends` + `Co-Authored-By: duyetbot <bot@duyet.net>`.
- Commits MUST be signed (`git commit -S`); `main` enforces `required_signatures`.
- Do NOT push or open a PR unless instructed.

## Steps

### Step 0 (spike — gates everything): map the common store interface

Read every file in `apps/dashboard/src/lib/conversation-store/`. Produce a short note (in the PR description or a scratch comment, not committed) answering:
1. Is there a shared interface/type (e.g. `ConversationStore`) all 5 backends implement? What is its exact read method(s) for listing conversations and fetching messages (names, signatures, pagination shape)?
2. How is the active store selected at runtime (the entry point the route would call)?
3. What is the conversation/message type shape that will be serialized?
4. Does the conversations route convention favor a new route file or a sub-path on `conversations.ts`?

**STOP and report** if there is no common read interface (the backends diverge such that a single export can't iterate all of them) — in that case the plan needs redesign (per-backend exporters), which is a decision for the maintainer.

**Verify**: you can state the exact read method signature and the store-selector entry point from real code.

### Step 1: Implement backend-agnostic export

Create `export.ts` exporting an async generator `exportConversationsJsonl(store, opts?): AsyncGenerator<string>` that iterates conversations via the common read interface from Step 0 and yields one JSON line per conversation (`JSON.stringify(conversation) + '\n'`). Use streaming/pagination if the read interface supports it (don't load everything into memory). Keep it pure w.r.t. transport — it only produces strings.

**Verify**: `cd apps/dashboard && bun run build` → exit 0.

### Step 2: Unit-test export against the in-memory store

Create `__tests__/export.test.ts` using `memory-store.ts` (no I/O) seeded with 2–3 conversations. Assert: each yielded line is valid JSON (`JSON.parse` round-trips), line count equals conversation count, empty store yields nothing, and the serialized fields match the seeded data. Model after an existing conversation-store test.

**Verify**: `cd apps/dashboard && bun test src/lib/conversation-store` → all pass; `cd apps/dashboard && bun run type-check:test` → exit 0.

### Step 3: Add the export API route

Create the export route (file or sub-path per Step 0's convention). It must: enforce the same auth/ownership checks the existing `conversations.ts` read path uses (reuse the same `authorize*` helper — do NOT invent a new auth path), select the active store via the Step 0 entry point, and stream the JSONL body with `Content-Type: application/x-ndjson`. Validate any query params (e.g. format) with the repo's existing validation approach.

**Verify**: `cd apps/dashboard && bun run build` → exit 0.

### Step 4: Test the route enforces auth + streams JSONL

Create the route test (model after a sibling `routes/api/v1/__tests__` test). Cover: unauthenticated request → rejected (same status the read path returns); authenticated request → 200 with `application/x-ndjson` body whose lines `JSON.parse` cleanly.

**Verify**: `cd apps/dashboard && bun test src/routes/api/v1` → all pass; `cd apps/dashboard && bun run type-check:test` → exit 0.

## Test plan

- `export.test.ts`: JSONL validity, count, empty-store, field fidelity (via memory-store).
- route test: auth enforcement + content-type + parseable stream.
- Pattern: existing conversation-store test + a sibling v1 route test.

## Done criteria

- [ ] `cd apps/dashboard && bun run build` exits 0
- [ ] `cd apps/dashboard && bun run type-check:test` exits 0
- [ ] `cd apps/dashboard && bun test src/lib/conversation-store src/routes/api/v1` passes; new tests present
- [ ] `bun run lint` exits 0
- [ ] Export goes through the common store interface (no per-backend special-casing) and reuses the existing auth helper
- [ ] `git status` shows only in-scope files changed
- [ ] `plans/README.md` Run-2 status row for 027 updated

## STOP conditions

- Step 0 finds no common read interface across the 5 backends (report; needs redesign).
- The conversations route's auth helper can't be reused for export without changing it (out of scope) — report.
- A verification fails twice after a reasonable fix.
- Streaming the response requires a transport pattern not already used in the repo's routes — report rather than introduce a new streaming abstraction.

## Maintenance notes

- Follow-up (separate plan): a UI "Export conversations" button that hits this route; and the reverse `import` path.
- If a 6th storage backend is added, it gets export for free as long as it implements the common read interface — note this in the interface's doc comment so the contract is explicit.
- Reviewer should confirm export reuses the existing ownership/auth check so a user can't export another tenant's conversations.
