/**
 * Regression: every shipped query-config SQL must pass the security validator.
 *
 * `validateSqlQuery` gates every free-form SQL entry point (AI agent tools, the
 * MCP `query` tool, the explorer custom-query box, and the `/api/v1/data` and
 * `/api/v1/explain` routes). If the dashboard itself ships a query the
 * validator rejects, a user who copies that query into any of those surfaces is
 * blocked from a query the product demonstrably considers safe.
 *
 * This previously failed for 8 shipped configs (false positives in the denylist
 * for `UNION ALL SELECT`, the read-only `replace()` function, and disjunctive
 * `col = 'A' OR col = 'B'` filters). The validator was tightened to keep
 * blocking real DDL/DML and dangerous table functions while allowing these.
 *
 * This test is intentionally corpus-wide (not a fixed list) so any NEW shipped
 * query that the validator would reject fails here immediately.
 */

import { queries } from '../index'
import { describe, expect, test } from 'bun:test'
import { getAllSqlStrings, validateSqlQuery } from '@chm/sql-builder'

describe('shipped query-config SQL passes validateSqlQuery', () => {
  test('every query-config SQL variant is accepted by the validator', () => {
    const rejected: { name: string; error: string; sql: string }[] = []

    for (const config of queries) {
      for (const sql of getAllSqlStrings(config.sql)) {
        try {
          validateSqlQuery(sql)
        } catch (error) {
          rejected.push({
            name: config.name,
            error: (error as Error).message,
            sql: sql.replace(/\s+/g, ' ').slice(0, 160),
          })
        }
      }
    }

    if (rejected.length > 0) {
      const report = rejected
        .map((r) => `  - [${r.name}] ${r.error}\n      ${r.sql}`)
        .join('\n')
      throw new Error(
        `${rejected.length} shipped query-config SQL string(s) rejected by validateSqlQuery:\n${report}`
      )
    }

    expect(rejected).toHaveLength(0)
  })

  test('corpus is non-empty (guards against an empty/mis-imported registry)', () => {
    const total = queries.reduce(
      (sum, c) => sum + getAllSqlStrings(c.sql).length,
      0
    )
    expect(total).toBeGreaterThan(50)
  })
})
