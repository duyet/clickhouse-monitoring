import type { FilterSchema } from '../types'

import {
  applyFilterPlaceholder,
  buildWhereClause,
  FILTER_PLACEHOLDER,
} from '../where-builder'
import { describe, expect, it } from 'bun:test'

const schema: FilterSchema = {
  fields: [
    {
      key: 'user',
      column: 'user',
      label: 'User',
      type: 'select',
      operators: ['in', 'notIn', 'eq', 'contains'],
    },
    {
      key: 'query',
      column: 'query',
      label: 'Query text',
      type: 'text',
      operators: ['contains', 'notContains', 'eq'],
    },
    {
      key: 'memory',
      column: 'memory_usage',
      label: 'Memory',
      type: 'number',
      operators: ['gte', 'lt', 'between'],
      unit: 'MB',
      scale: 1024 * 1024,
    },
    {
      key: 'event_time',
      column: 'event_time',
      label: 'Time',
      type: 'datetime',
      operators: ['withinHours', 'between', 'gte'],
    },
  ],
}

describe('buildWhereClause', () => {
  it('returns an empty clause when there are no filters', () => {
    const { clause, params } = buildWhereClause(schema, [])
    expect(clause).toBe('')
    expect(params).toEqual({})
  })

  it('builds a case-insensitive contains condition', () => {
    const { clause, params } = buildWhereClause(schema, [
      { key: 'query', operator: 'contains', values: ['SELECT'] },
    ])
    expect(clause).toBe(
      'WHERE positionCaseInsensitiveUTF8(toString(query), {flt_0:String}) > 0'
    )
    expect(params).toEqual({ flt_0: 'SELECT' })
  })

  it('builds an IN condition with one parameter per value', () => {
    const { clause, params } = buildWhereClause(schema, [
      { key: 'user', operator: 'in', values: ['default', 'monitoring'] },
    ])
    expect(clause).toBe('WHERE user IN ({flt_0:String}, {flt_1:String})')
    expect(params).toEqual({ flt_0: 'default', flt_1: 'monitoring' })
  })

  it('scales numeric values before comparison', () => {
    const { clause, params } = buildWhereClause(schema, [
      { key: 'memory', operator: 'gte', values: ['100'] },
    ])
    expect(clause).toBe('WHERE memory_usage >= {flt_0:Float64}')
    expect(params).toEqual({ flt_0: 100 * 1024 * 1024 })
  })

  it('builds a numeric BETWEEN condition', () => {
    const { clause, params } = buildWhereClause(schema, [
      { key: 'memory', operator: 'between', values: ['1', '2'] },
    ])
    expect(clause).toBe(
      'WHERE memory_usage BETWEEN {flt_0:Float64} AND {flt_1:Float64}'
    )
    expect(params).toEqual({ flt_0: 1024 * 1024, flt_1: 2 * 1024 * 1024 })
  })

  it('builds a relative time condition', () => {
    const { clause, params } = buildWhereClause(schema, [
      { key: 'event_time', operator: 'withinHours', values: ['24'] },
    ])
    expect(clause).toBe(
      'WHERE event_time > now() - toIntervalHour(toUInt64OrZero({flt_0:String}))'
    )
    expect(params).toEqual({ flt_0: '24' })
  })

  it('parses datetime values with parseDateTimeBestEffort', () => {
    const { clause } = buildWhereClause(schema, [
      { key: 'event_time', operator: 'gte', values: ['2026-01-01'] },
    ])
    expect(clause).toBe(
      'WHERE event_time >= parseDateTimeBestEffort({flt_0:String})'
    )
  })

  it('joins multiple conditions with AND', () => {
    const { clause } = buildWhereClause(schema, [
      { key: 'user', operator: 'eq', values: ['default'] },
      { key: 'memory', operator: 'gte', values: ['10'] },
    ])
    expect(clause).toContain('user = {flt_0:String}')
    expect(clause).toContain('AND memory_usage >= {flt_1:Float64}')
  })

  it('skips filters referencing an unknown field', () => {
    const { clause, params } = buildWhereClause(schema, [
      { key: 'does_not_exist', operator: 'eq', values: ['x'] },
    ])
    expect(clause).toBe('')
    expect(params).toEqual({})
  })

  it('skips operators that the field does not allow', () => {
    const { clause } = buildWhereClause(schema, [
      // `query` does not allow `between`
      { key: 'query', operator: 'between', values: ['a', 'b'] },
    ])
    expect(clause).toBe('')
  })

  it('drops non-numeric values on number fields', () => {
    const { clause } = buildWhereClause(schema, [
      { key: 'memory', operator: 'gte', values: ['not-a-number'] },
    ])
    expect(clause).toBe('')
  })
})

describe('applyFilterPlaceholder', () => {
  it('replaces the marker in a plain string query', () => {
    const sql = `SELECT * FROM t ${FILTER_PLACEHOLDER} ORDER BY a`
    expect(applyFilterPlaceholder(sql, 'WHERE a = 1')).toBe(
      'SELECT * FROM t WHERE a = 1 ORDER BY a'
    )
  })

  it('replaces the marker in every versioned SQL variant', () => {
    const sql = [
      { since: '23.8', sql: `SELECT 1 ${FILTER_PLACEHOLDER}` },
      { since: '24.1', sql: `SELECT 2 ${FILTER_PLACEHOLDER}` },
    ]
    const result = applyFilterPlaceholder(sql, 'WHERE x')
    expect(result[0].sql).toBe('SELECT 1 WHERE x')
    expect(result[1].sql).toBe('SELECT 2 WHERE x')
  })

  it('removes the marker when the clause is empty', () => {
    const sql = `SELECT 1 ${FILTER_PLACEHOLDER} ORDER BY a`
    expect(applyFilterPlaceholder(sql, '')).toBe('SELECT 1  ORDER BY a')
  })
})
