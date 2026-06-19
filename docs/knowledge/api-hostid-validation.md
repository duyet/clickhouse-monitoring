---
id: api-hostid-validation
title: API hostId Boundary Validation Contract
type: decision
status: active
updated: 2026-06-20
tags:
  - api
  - validation
  - routes
related:
  - sql-validator-threat-model
  - conventions
---

# API hostId Boundary Validation Contract

**Contract:** every API route that reads a `hostId` query param must validate it
as a **non-negative integer** at the request boundary and return **400** if not.

The canonical check (matching `lib/api/shared/validators/host-id.ts` and routes
like `/api/v1/overview`, `/api/v1/dashboard/settings`):

```ts
const hostId = Number(searchParams.get('hostId') ?? '0')
if (!Number.isInteger(hostId) || hostId < 0) {
  return Response.json(
    { success: false, error: { type: 'validation', message: 'Invalid hostId' } },
    { status: 400 }
  )
}
```

## The bug (2026-06-20)

Nine routes used the looser guard `!Number.isFinite(hostId)`, which **accepts
negative (`-1`) and fractional (`1.5`)** values — both invalid host-array
indices. Such a request returned **200** and flowed to the data layer, where
`getAndValidateClientConfig` (in `@chm/clickhouse-client`) throws on the
out-of-range index → a **500** that `use-chart-data` then retries 3×.

Verified against the real `/api/v1/charts/$name` handler: `?hostId=-1` and
`?hostId=1.5` returned 200 before the fix, 400 after.

Fixed routes: `charts/$name`, `tables/$name`, `health/checks`, and the
`explorer/{tables,query,query-log,preview,projections,skip-indexes}` group.

## Why `Number(...)` not `parseInt(...)`

`Number('1abc')` is `NaN` (rejected — good), whereas `parseInt('1abc', 10)` is
`1` (silently accepted). The route boundary deliberately uses `Number(...)`.
Note `validateHostId` in the shared validators uses `parseInt` and is
documented/tested to accept trailing junk (`'1abc' → 1`) — that leniency is
intentional there, so do not "fix" it; the route boundary is the stricter gate.

## Guard

`src/routes/api/__tests__/hostid-validation-contract.test.ts` scans all route
source and fails if any route uses `!Number.isFinite(hostId)`, or parses
`const hostId = Number(...)` without the non-negative-integer guard (inline or
via an `isValidHostId()` helper). Behavioral coverage:
`src/routes/api/v1/charts/__tests__/hostid-validation.test.ts`. Hot-path
throughput: `…/validators/__tests__/host-id.bench.ts` (~0.02 µs/op).
