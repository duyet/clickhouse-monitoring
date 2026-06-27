/**
 * Tests for table-overview.ts
 *
 * Validates the explorer table overview QueryConfigs used by the generic
 * /api/v1/tables/$name endpoint.
 */

import {
  explorerTableOverviewConfig,
  explorerTableUsageConfig,
} from './table-overview'
import { describe, expect, test } from 'bun:test'

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

describe('explorerTableOverviewConfig', () => {
  test('has the expected name', () => {
    expect(explorerTableOverviewConfig.name).toBe('explorer-table-overview')
  })

  test('has a non-empty string sql referencing system tables and parts', () => {
    expect(typeof explorerTableOverviewConfig.sql).toBe('string')
    const sql = explorerTableOverviewConfig.sql as string
    expect(isNonEmptyString(sql)).toBe(true)
    expect(sql).toContain('system.tables')
    expect(sql).toContain('system.parts')
  })

  test('declares expected summary columns', () => {
    expect(Array.isArray(explorerTableOverviewConfig.columns)).toBe(true)
    expect(explorerTableOverviewConfig.columns.length).toBeGreaterThan(0)

    for (const column of [
      'total_bytes',
      'total_rows',
      'engine',
      'compressed_bytes',
      'uncompressed_bytes',
      'active_parts',
    ]) {
      expect(explorerTableOverviewConfig.columns).toContain(column)
    }
  })
})

describe('explorerTableUsageConfig', () => {
  test('has the expected optional query_log shape', () => {
    expect(explorerTableUsageConfig.name).toBe('explorer-table-usage')
    expect(explorerTableUsageConfig.optional).toBe(true)
    expect(explorerTableUsageConfig.tableCheck).toBe('system.query_log')
  })

  test('uses version-aware sql entries', () => {
    expect(Array.isArray(explorerTableUsageConfig.sql)).toBe(true)

    const sql = explorerTableUsageConfig.sql as {
      since: string
      sql: string
    }[]
    for (const entry of sql) {
      expect(isNonEmptyString(entry.since)).toBe(true)
      expect(isNonEmptyString(entry.sql)).toBe(true)
    }
  })

  test('queries query_log table membership and declares usage columns', () => {
    const sql = (
      explorerTableUsageConfig.sql as {
        sql: string
      }[]
    )
      .map((entry) => entry.sql)
      .join('\n')

    expect(sql).toContain('system.query_log')
    expect(sql).toContain('has(tables')
    expect(explorerTableUsageConfig.columns).toContain('queries_24h')
    expect(explorerTableUsageConfig.columns).toContain('queries_7d')
  })
})
