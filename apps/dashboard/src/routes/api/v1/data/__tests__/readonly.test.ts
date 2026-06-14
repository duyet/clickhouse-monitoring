/**
 * Tests for data.ts ClickHouse readonly enforcement
 *
 * Structural verification that the /api/v1/data route enforces
 * `readonly: '1'` in clickhouse_settings for both GET and POST handlers.
 * This is a defense-in-depth measure: even if the SQL validation blocklist
 * is bypassed or incomplete, ClickHouse itself will reject DML/DDL.
 *
 * The explorer/query.ts route already sets `readonly: '1'`; this test
 * ensures the data route follows the same pattern.
 */

import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Source file is routes/api/v1/data.ts (sibling of the data/ directory)
const DATA_SOURCE = readFileSync(
  join((import.meta as any).dir, '..', '..', 'data.ts'),
  'utf-8'
)

describe('data.ts readonly enforcement (structural)', () => {
  test("GET handler sets readonly: '1' in clickhouse_settings", () => {
    // The GET handler should have readonly: '1' in its clickhouse_settings
    // within the handleGet function
    expect(DATA_SOURCE).toMatch(
      /handleGet[\s\S]*?clickhouse_settings:\s*\{[^}]*readonly:\s*'1'/
    )
  })

  test("POST handler sets readonly: '1' in clickhouse_settings", () => {
    // The POST handler should have readonly: '1' in its clickhouse_settings
    // within the handlePost function
    expect(DATA_SOURCE).toMatch(
      /handlePost[\s\S]*?clickhouse_settings:\s*\{[^}]*readonly:\s*'1'/
    )
  })

  test('readonly appears exactly twice (once per handler)', () => {
    const matches = DATA_SOURCE.match(/readonly:\s*'1'/g)
    expect(matches).not.toBeNull()
    expect(matches!.length).toBe(2)
  })

  test('session_timezone is preserved alongside readonly', () => {
    // Both handlers should spread session_timezone conditionally after readonly
    expect(DATA_SOURCE).toMatch(
      /readonly:\s*'1',\s*\.\.\.\(timezone\s*\?\s*\{\s*session_timezone:\s*timezone\s*\}\s*:\s*\{\}\)/
    )
  })
})
