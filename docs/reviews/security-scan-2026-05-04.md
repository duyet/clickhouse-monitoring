# Security Scan Report — 2026-05-04

## Scope
- Repository: `clickhouse-monitoring`
- Date: 2026-05-04 (UTC)
- Focus: API routes and auth flows with potential data exposure or authentication side-channel risk.

## Scan Method
- Pattern scan for insecure constructs in `app/`, `components/`, `lib/`, `scripts/`.
- Manual review of API-key minting endpoint and agent streaming endpoint.

## Risks Found and Fixed

### 1) Timing side-channel in API-key mint authorization
- **Location**: `app/api/v1/auth/api-key/route.ts`
- **Risk**: Authorization compared bearer token to `CHM_API_KEY_SECRET` using direct string equality.
- **Impact**: In theory, direct equality can leak timing differences versus constant-time comparison.
- **Fix**:
  - Added `timingSafeEqualString()` using byte-wise XOR over equal-length encoded strings.
  - Replaced `token !== secret` with constant-time compare function.

### 2) Prompt/data leakage through production logs in Agent API
- **Location**: `app/api/v1/agent/route.ts`
- **Risk**: Route logged message payload structure and serialized messages, which may include sensitive user prompts or operational details.
- **Impact**: Sensitive data could be exposed in production log pipelines.
- **Fix**:
  - Added `AGENT_DEBUG_LOGS` guard (`NODE_ENV !== 'production'`).
  - Disabled verbose payload logs in production.
  - Reduced remaining debug output to metadata only (message count and selected model).

## Commands Executed
- `rg -n "dangerouslySetInnerHTML|eval\(|new Function|child_process|exec\(|spawn\(|http://|target=\"_blank\"|process\.env" app components lib scripts`
- `bun run lint app/api/v1/auth/api-key/route.ts app/api/v1/agent/route.ts`
- `bun run build`

## Result
- High-priority risks identified in request handling/logging were fixed in code.
- Lint/build checks passed after remediation.
