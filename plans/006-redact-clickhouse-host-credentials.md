# Plan 006: Redact Inline Credentials from ClickHouse Host Logs

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3fba89acc..HEAD -- packages/clickhouse-client/src/clickhouse/clickhouse-config.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `3fba89acc`, 2026-06-13

## Why this matters

The application logs details of configured ClickHouse hosts at start-up and in debug modes. If a ClickHouse connection host is defined with inline basic authentication credentials (e.g., `http://username:password@hostname:port`), these plaintext credentials are logged directly to console output. 

This creates a security risk where database passwords can be leaked to application logs, persistent log management systems, or diagnostic summaries. Redacting the credentials from the logged host string prevents credential exposure.

## Current state

The file `packages/clickhouse-client/src/clickhouse/clickhouse-config.ts` prints environment configurations:

```typescript
// packages/clickhouse-client/src/clickhouse/clickhouse-config.ts:67-75
  } else {
    debug('[ClickHouse Config] CLICKHOUSE_HOST:', hostEnv)
    debug('[ClickHouse Config] CLICKHOUSE_USER:', userEnv ? '***' : '(empty)')
    debug(
      '[ClickHouse Config] CLICKHOUSE_PASSWORD:',
      passwordEnv ? '***' : '(empty)'
    )
    debug('[ClickHouse Config] CLICKHOUSE_NAME:', customNameEnv || '(empty)')
  }
```

And details of each parsed host config:

```typescript
// packages/clickhouse-client/src/clickhouse/clickhouse-config.ts:112-118
    debug(`[ClickHouse Config] Host ${index}:`, {
      id: config.id,
      host: config.host,
      user: config.user,
      hasPassword: !!config.password,
      customName: config.customName,
    })
```

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0 |
| Typecheck | `bun run type-check` | exit 0, no errors |
| Test      | `bun run test:packages` | exit 0, all tests pass |
| Lint      | `biome lint .` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `packages/clickhouse-client/src/clickhouse/clickhouse-config.ts`
- `packages/clickhouse-client/src/__tests__/clickhouse-config.test.ts` (create or modify)

**Out of scope**:
- Other packages or apps in the monorepo.

## Git workflow

- Branch: `advisor/006-redact-clickhouse-host-credentials`
- Commit message: `security(clickhouse-client): redact inline credentials from host config debug logs`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Implement host credential redaction utility in clickhouse-config.ts

Open [clickhouse-config.ts](file:///Users/duet/project/clickhouse-monitor/packages/clickhouse-client/src/clickhouse/clickhouse-config.ts). Add a utility function to redact credentials from a URL:

```typescript
/**
 * Redacts username and password credentials from a ClickHouse host URL string
 */
export function redactHostCredentials(urlStr: string): string {
  try {
    const url = new URL(urlStr)
    if (url.username || url.password) {
      url.username = '***'
      url.password = '***'
    }
    return url.toString()
  } catch {
    // Fallback regex if URL constructor fails (e.g. for incomplete or relative hosts)
    return urlStr.replace(/(https?:\/\/)([^:]+):([^@]+)@/, '$1***:***@')
  }
}
```

### Step 2: Use the redaction utility in debug logs

In the same file [clickhouse-config.ts](file:///Users/duet/project/clickhouse-monitor/packages/clickhouse-client/src/clickhouse/clickhouse-config.ts), replace the plaintext logs with redacted logs:

1. Replace line 68:
   ```typescript
   debug('[ClickHouse Config] CLICKHOUSE_HOST:', hostEnv)
   ```
   with:
   ```typescript
   const redactedHostEnv = splitByComma(hostEnv).map(redactHostCredentials).join(',')
   debug('[ClickHouse Config] CLICKHOUSE_HOST:', redactedHostEnv)
   ```

2. Replace line 114:
   ```typescript
   host: config.host,
   ```
   with:
   ```typescript
   host: redactHostCredentials(config.host),
   ```

**Verify**: `bun run type-check` returns exit 0.

### Step 3: Add unit tests for redactHostCredentials

Create or modify tests in `packages/clickhouse-client/src/__tests__/clickhouse-config.test.ts` (or create it if it doesn't exist) to verify the redaction logic:

```typescript
import { describe, expect, it } from 'bun:test'
import { redactHostCredentials } from '../clickhouse/clickhouse-config'

describe('redactHostCredentials', () => {
  it('should leave host without credentials unchanged', () => {
    expect(redactHostCredentials('http://localhost:8123')).toBe('http://localhost:8123/')
  })

  it('should redact username and password from http URL', () => {
    expect(redactHostCredentials('http://admin:secret@clickhouse.prod:8123')).toBe('http://***:***@clickhouse.prod:8123/')
  })

  it('should redact credentials from https URL', () => {
    expect(redactHostCredentials('https://user:pass123@clickhouse.prod')).toBe('https://***:***@clickhouse.prod/')
  })

  it('should handle invalid URLs gracefully', () => {
    expect(redactHostCredentials('invalid-url-string')).toBe('invalid-url-string')
  })
})
```

**Verify**: `bun run test:packages` passes successfully.

## Test plan

- Run `bun run test:packages`
- Verify that `redactHostCredentials` passes all assertions and does not break any existing client configuration tests.

## Done criteria

- [ ] `bun run type-check` exits 0.
- [ ] `bun run test:packages` runs and passes.
- [ ] Debug logs for `CLICKHOUSE_HOST` mask inline passwords.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If mutating the host logging changes how `@chm/clickhouse-client` actually instantiates its connections (the connection object must still receive the raw `config.host` containing any credentials, only the logs should be redacted).

## Maintenance notes

- None.
