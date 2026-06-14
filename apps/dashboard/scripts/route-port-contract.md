# Next → TanStack Start: API route port contract

Reusable spec for porting `apps/dashboard/app/api/**/route.ts` →
`apps/dashboard/src/routes/api/**/*.ts`. Mechanical; follow exactly.

## Wrapper
```ts
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/v1/<path>')({
  server: { handlers: { GET: async ({ request, params }) => { /* body */ } } },
})
```
- `export const GET/POST = ...` → a `handlers.GET/POST` entry.
- Drop `export const dynamic = 'force-dynamic'` (Next-only).
- File-route path string MUST equal the URL (`/api/v1/...`).

## Dynamic segments
- `[name]` → `$name`, `[key]` → `$key` (dir + filename). Read via `params.name`.
- `[...slug]` → `$` splat (defer these — usually proxy routes).

## ClickHouse env bridge (REQUIRED before any fetchData/getClient)
```ts
import { env } from 'cloudflare:workers'
import { bridgeClickHouseEnv } from '@/lib/api/server-env'
// inside handler, before querying:
bridgeClickHouseEnv(env as Record<string, string | undefined>)
```
Then `fetchData({ query, hostId, format, query_params, queryConfig })` works
unchanged. For ad-hoc clients use `getWebClient(hostId, env)` from
`@/lib/api/query-executor`. For registry configs use `executeTableConfig` /
`executeChartQuery` with `{ bindings: env }`.

## Auth / permissions — DROP at route level
- Remove `import { authorizeFeatureRequest } from '@/lib/feature-permissions/server'`
  and its call/`permissionResponse` block. (Pulls Clerk-Next + js-yaml + smol-toml.)
- Per-route auth is centralized in the request **middleware (#1397)**. Precedent:
  merged `charts/$name.ts` / `tables/$name.ts` call no per-route auth.
- Keep `serverQueryConfig` itself (it still feeds `fetchData`); only drop the
  `?.permission` → `authorizeFeatureRequest` usage.

## Shared helpers — already exist in TSR (import unchanged)
`@/lib/api/error-handler` (`withApiHandler`, `createValidationError`,
`createErrorResponse`, `getHostIdFromParams`), `@/lib/api/shared/response-builder`
(`createSuccessResponse`), `@/lib/api/shared/status-code-mapper`
(`mapErrorTypeToStatusCode`), `@/lib/api/shared/validators` (`validateSearchParams`,
`getAndValidateHostId`, `validateDataRequest`, `sanitizeQueryParams`),
`@/lib/api/table-registry`, `@/lib/api/chart-registry`, `@/lib/api/types`.

`withApiHandler(fn, ctx)` returns `(request) => Promise<Response>`; expose as
`GET: ({ request }) => wrapped(request)`. Use it for routes that used it in Next;
otherwise inline try/catch returning `{ success, data|error, metadata }`.

## Co-located non-route helpers
Next co-locates `validators/` + `utils/` next to `route.ts`. TSR routes dir
can't hold arbitrary files → move them to `src/lib/api/<route>/` and fix imports.

## Fail loud
If a route's core depends on a module ABSENT in TSR (Clerk server, Postgres,
D1 conversation store, agent infra), DO NOT fake it — report it deferred with
the missing dep. Deferred set: agent*, agents/*, conversations*, auth/api-key,
browser-connections/*, peerdb/$ (splat), health/webhook, cron/*, clean, init.
