/**
 * Tests for browser-connections/proxy SQL validation
 *
 * Verifies that the proxy endpoint's SQL validation gate works correctly.
 *
 * Since bun:test mock.module is process-global and shared-mocks.ts already
 * mocks @chm/sql-builder as a no-op for AI agent tests, we cannot reliably
 * test through the route module in the full suite. Instead, we:
 *
 * 1. Structurally verify the proxy source imports and calls validateSqlQuery
 * 2. Behaviorally verify validateSqlQuery rejects DDL/DML (when not mocked)
 *
 * The full behavioral coverage lives in:
 *   packages/sql-builder/src/__tests__/sql-validator.test.ts
 */

import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const PROXY_SOURCE = readFileSync(
  join((import.meta as any).dir, '..', 'proxy.ts'),
  'utf-8'
)

describe('browser-connections proxy SQL validation (structural)', () => {
  test('proxy.ts imports validateSqlQuery from @chm/sql-builder', () => {
    expect(PROXY_SOURCE).toContain(
      "import { validateSqlQuery } from '@chm/sql-builder'"
    )
  })

  test('proxy.ts calls validateSqlQuery(query) in a try/catch', () => {
    expect(PROXY_SOURCE).toMatch(/try\s*\{[\s\S]*?validateSqlQuery\(query\)/)
  })

  test('proxy.ts returns validation error when validateSqlQuery throws', () => {
    expect(PROXY_SOURCE).toContain('SQL validation failed')
  })

  test('proxy.ts has SECURITY comment before the validation block', () => {
    expect(PROXY_SOURCE).toContain('// SECURITY: Validate SQL query')
  })
})

describe('validateSqlQuery rejects DDL/DML (behavioral, when real)', () => {
  // Check if validateSqlQuery is the real implementation or the shared-mocks no-op.
  // The real function throws on 'DROP TABLE users'; the mock does not.
  let validateSqlQuery: (sql: string) => void
  let isReal: boolean

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@chm/sql-builder')
    validateSqlQuery = mod.validateSqlQuery
    validateSqlQuery('DROP TABLE test_proxy_detection_only')
    isReal = false // mock absorbed it
  } catch {
    isReal = true // real function threw
  }

  test('rejects DROP TABLE', () => {
    if (!isReal) return
    expect(() => validateSqlQuery('DROP TABLE users')).toThrow(/dangerous SQL/)
  })

  test('rejects DELETE FROM', () => {
    if (!isReal) return
    expect(() =>
      validateSqlQuery('DELETE FROM system.query_log WHERE 1=1')
    ).toThrow(/dangerous SQL/)
  })

  test('rejects INSERT INTO', () => {
    if (!isReal) return
    expect(() =>
      validateSqlQuery('INSERT INTO users VALUES (1, "admin")')
    ).toThrow(/dangerous SQL/)
  })

  test('allows SELECT', () => {
    if (!isReal) return
    expect(() => validateSqlQuery('SELECT 1')).not.toThrow()
  })
})
