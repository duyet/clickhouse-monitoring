import { describe, expect, test } from 'bun:test'
import './shared-mocks'

const {
  extractReferencedTables,
  extractWhereColumns,
  isLikelyExploratorySelect,
  validateAgentSql,
} = await import('../sql-analysis')

describe('sql-analysis helpers', () => {
  test('extracts referenced tables from FROM and JOIN clauses', () => {
    const tables = extractReferencedTables(
      'SELECT * FROM analytics.events e JOIN `default`.`users` u ON u.id = e.user_id',
      'default'
    )

    expect(tables.map((table) => table.qualifiedName)).toEqual([
      'analytics.events',
      'default.users',
    ])
  })

  test('extracts filter columns from WHERE and PREWHERE clauses', () => {
    const columns = extractWhereColumns(
      'SELECT count() FROM events PREWHERE tenant_id = 1 WHERE event_date >= today() AND status IN (1, 2)'
    )

    expect(columns.map((column) => column.name)).toContain('tenant_id')
    expect(columns.map((column) => column.name)).toContain('event_date')
    expect(columns.map((column) => column.name)).toContain('status')
  })

  test('normalizes safe SQL and strips trailing semicolons', () => {
    expect(validateAgentSql('SELECT count(*) FROM system.tables;;')).toBe(
      'SELECT count(*) FROM system.tables'
    )
  })

  test('detects exploratory selects without limits or aggregations', () => {
    expect(isLikelyExploratorySelect('SELECT name FROM system.tables')).toBe(
      true
    )
    expect(isLikelyExploratorySelect('SELECT count() FROM system.tables')).toBe(
      false
    )
    expect(
      isLikelyExploratorySelect('SELECT name FROM system.tables LIMIT 10')
    ).toBe(false)
  })
})
