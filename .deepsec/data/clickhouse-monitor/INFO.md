# clickhouse-monitor

## What this codebase does

Next.js 15 / React 19 dashboard for monitoring ClickHouse clusters through
system tables. It serves static UI pages plus dynamic `/api/v1/*` routes that
execute predefined ClickHouse queries, explorer queries, AI-agent requests, MCP
tools, conversation storage, and a browser-supplied ClickHouse connection
proxy. Deployments are Docker or Cloudflare Workers; ClickHouse host/user/pass
come from env and may be comma-separated for multi-host monitoring.

## Auth shape

- `middleware.ts` enforces optional global API-key auth for `/api/v1/*` when
  `CHM_API_KEY_SECRET` is set; `/api/v1/auth/api-key` mints signed keys and is
  guarded by the secret itself.
- `getAuthProvider` / `parseAuthProvider` support only `none` and `clerk`;
  unset auth means most dashboard surfaces are intentionally public.
- `authorizeFeatureRequest` gates feature-specific API work from TOML/YAML/env
  feature overrides; `AGENT_FEATURE_PERMISSION` and `ACTIONS_FEATURE_PERMISSION`
  default to `authenticated`.
- `authorizeAgentApiRequest` allows either Clerk session auth or a valid
  `AGENT_API_TOKEN` bearer token via `isValidAgentApiBearerToken`.
- `resolveUserId` fails closed for conversation storage unless Clerk is enabled,
  `CLERK_SECRET_KEY` exists, and Clerk returns a user id.

## Threat model

Highest-impact bugs expose ClickHouse credentials, query results, schema,
running SQL, user/role data, or let a remote caller run unexpected ClickHouse
commands against configured hosts. Next risk is bypassing feature gates for AI
agent/actions/MCP/conversation APIs, because these surfaces can consume LLM
keys, persist user data, or mutate/kill ClickHouse work. Browser-supplied
connections are intentionally supported but must keep SSRF and credential
logging controls intact.

## Project-specific patterns to flag

- Raw ClickHouse execution should normally flow through `fetchData` with
  `hostId`, `query_params`, and registry-backed `queryConfig`; direct
  interpolation is only acceptable for validated identifiers like
  `isValidTableIdentifier`.
- `/api/v1/data` must keep the `validateDashboardQuery` allowlist when
  `queryConfig` is missing; `/api/v1/explorer/query` must stay read-only and
  use `validateSqlQuery`.
- API handlers for protected features must call `authorizeFeatureRequest` with
  the matching permission before running ClickHouse queries or external calls.
- Agent endpoints (`/api/v1/agent`, followups, skills, config-check, models)
  should call `authorizeAgentApiRequest`, not only rely on Clerk middleware.
- Browser connection proxy must validate host URLs with `validateHostUrl` and
  use `createHostValidationFetch`; credentials from request bodies should not be
  logged or copied into metadata.

## Known false-positives

- `/api/v1/hosts`, `/api/v1/config`, `/api/v1/mcp/info`, `/llms.txt`, and docs
  endpoints are intended public discovery/config surfaces; they should not leak
  ClickHouse passwords or LLM secrets.
- `verifyApiKey` accepts any token only when `CHM_API_KEY_SECRET` is unset; that
  means API-key auth is disabled, not a bypass of enabled auth.
- Query configs under `lib/query-config/` and chart builders intentionally
  contain SQL strings; many are static monitoring queries against `system.*`.
- Tests and Cypress fixtures use fake bearer tokens, Clerk mocks, and sample
  ClickHouse URLs; do not treat them as live secrets.
- `wrangler.toml` may include public ClickHouse host names and Clerk
  publishable keys; ClickHouse passwords and signing secrets are expected to be
  Worker secrets or env values, not plaintext config.
