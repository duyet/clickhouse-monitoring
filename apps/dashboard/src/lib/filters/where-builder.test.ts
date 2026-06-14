import type { ActiveFilter, FilterField, FilterSchema } from './types'

import {
  applyFilterPlaceholder,
  buildWhereClause,
  FILTER_PLACEHOLDER,
} from './where-builder'
import { describe, expect, test } from 'bun:test'

/** Build a one-field schema quickly. */
function schemaOf(
  field: Partial<FilterField> & Pick<FilterField, 'key'>
): FilterSchema {
  return {
    fields: [
      {
        column: field.key,
        label: field.key,
        type: 'text',
        operators: [
          'eq',
          'ne',
          'contains',
          'notContains',
          'in',
          'notIn',
          'between',
          'gt',
          'gte',
          'lt',
          'lte',
          'withinHours',
        ],
        ...field,
      } as FilterField,
    ],
  }
}

function filter(
  key: string,
  operator: ActiveFilter['operator'],
  values: string[]
): ActiveFilter {
  return { key, operator, values }
}

describe('buildWhereClause — security invariant', () => {
  test('user values are NEVER interpolated into the SQL string', () => {
    const schema = schemaOf({ key: 'user', column: 'user', type: 'text' })
    const malicious = "default'; DROP TABLE system.query_log; --"
    const { clause, params } = buildWhereClause(schema, [
      filter('user', 'eq', [malicious]),
    ])

    // The dangerous value must live in params, not in the clause text.
    expect(clause).not.toContain('DROP TABLE')
    expect(clause).toContain('{flt_0:String}')
    expect(Object.values(params)).toContain(malicious)
  })

  test('column names come from the schema, not the filter key alias', () => {
    const schema = schemaOf({
      key: 'mem',
      column: 'memory_usage',
      type: 'number',
    })
    const { clause } = buildWhereClause(schema, [filter('mem', 'gt', ['100'])])
    expect(clause).toContain('memory_usage >')
  })
})

describe('buildWhereClause — schema gating', () => {
  test('skips filters referencing an unknown field', () => {
    const schema = schemaOf({ key: 'user' })
    const { clause, params } = buildWhereClause(schema, [
      filter('ghost', 'eq', ['x']),
    ])
    expect(clause).toBe('')
    expect(params).toEqual({})
  })

  test('skips an operator the field does not allow', () => {
    const schema: FilterSchema = {
      fields: [
        {
          key: 'user',
          column: 'user',
          label: 'user',
          type: 'text',
          operators: ['eq'],
        },
      ],
    }
    const { clause } = buildWhereClause(schema, [filter('user', 'gt', ['5'])])
    expect(clause).toBe('')
  })

  test('returns empty clause when there are no filters', () => {
    expect(buildWhereClause(schemaOf({ key: 'user' }), [])).toEqual({
      clause: '',
      params: {},
    })
  })
})

describe('buildWhereClause — operators', () => {
  test('eq / ne / gt / gte / lt / lte map to SQL symbols', () => {
    const schema = schemaOf({ key: 'n', column: 'n', type: 'number' })
    const cases: Array<[ActiveFilter['operator'], string]> = [
      ['eq', 'n ='],
      ['ne', 'n !='],
      ['gt', 'n >'],
      ['gte', 'n >='],
      ['lt', 'n <'],
      ['lte', 'n <='],
    ]
    for (const [op, expected] of cases) {
      const { clause } = buildWhereClause(schema, [filter('n', op, ['1'])])
      expect(clause).toContain(expected)
    }
  })

  test('contains / notContains use positionCaseInsensitiveUTF8', () => {
    const schema = schemaOf({ key: 'q', column: 'query', type: 'text' })
    expect(
      buildWhereClause(schema, [filter('q', 'contains', ['SELECT'])]).clause
    ).toContain(
      'positionCaseInsensitiveUTF8(toString(query), {flt_0:String}) > 0'
    )
    expect(
      buildWhereClause(schema, [filter('q', 'notContains', ['x'])]).clause
    ).toContain('= 0')
  })

  test('in / notIn emit a parameterized list', () => {
    const schema = schemaOf({ key: 'u', column: 'user', type: 'text' })
    const { clause, params } = buildWhereClause(schema, [
      filter('u', 'in', ['a', 'b', 'c']),
    ])
    expect(clause).toContain(
      'user IN ({flt_0:String}, {flt_1:String}, {flt_2:String})'
    )
    expect(Object.keys(params)).toHaveLength(3)

    expect(
      buildWhereClause(schema, [filter('u', 'notIn', ['a'])]).clause
    ).toContain('user NOT IN')
  })

  test('between needs two operands', () => {
    const schema = schemaOf({ key: 'n', column: 'n', type: 'number' })
    const { clause } = buildWhereClause(schema, [
      filter('n', 'between', ['10', '20']),
    ])
    expect(clause).toContain('n BETWEEN {flt_0:Float64} AND {flt_1:Float64}')

    // A single value is insufficient → condition dropped.
    expect(
      buildWhereClause(schema, [filter('n', 'between', ['10'])]).clause
    ).toBe('')
  })

  test('withinHours coerces to an interval-hour expression', () => {
    const schema = schemaOf({
      key: 't',
      column: 'event_time',
      type: 'datetime',
    })
    const { clause } = buildWhereClause(schema, [
      filter('t', 'withinHours', ['24']),
    ])
    expect(clause).toContain(
      'event_time > now() - toIntervalHour(toUInt64OrZero({flt_0:String}))'
    )
  })

  test('joins multiple conditions with AND', () => {
    const schema: FilterSchema = {
      fields: [
        {
          key: 'u',
          column: 'user',
          label: 'u',
          type: 'text',
          operators: ['eq'],
        },
        {
          key: 'n',
          column: 'n',
          label: 'n',
          type: 'number',
          operators: ['gt'],
        },
      ],
    }
    const { clause } = buildWhereClause(schema, [
      filter('u', 'eq', ['default']),
      filter('n', 'gt', ['5']),
    ])
    expect(clause.startsWith('WHERE ')).toBe(true)
    expect(clause).toContain('AND')
  })
})

describe('buildWhereClause — operand coercion', () => {
  test('number field scales the value before parameterizing', () => {
    const schema = schemaOf({
      key: 'mem',
      column: 'memory',
      type: 'number',
      scale: 1048576, // MB → bytes
    })
    const { params } = buildWhereClause(schema, [filter('mem', 'eq', ['2'])])
    expect(Object.values(params)).toContain(2 * 1048576)
  })

  test('non-numeric value on a number field drops the condition', () => {
    const schema = schemaOf({ key: 'n', column: 'n', type: 'number' })
    expect(buildWhereClause(schema, [filter('n', 'eq', ['abc'])]).clause).toBe(
      ''
    )
  })

  test('datetime field wraps the value in parseDateTimeBestEffortOrNull', () => {
    const schema = schemaOf({ key: 't', column: 'ts', type: 'datetime' })
    const { clause } = buildWhereClause(schema, [
      filter('t', 'eq', ['2026-01-01']),
    ])
    expect(clause).toContain('parseDateTimeBestEffortOrNull({flt_0:String})')
  })

  test('blank/whitespace-only values are dropped', () => {
    const schema = schemaOf({ key: 'u', column: 'user', type: 'text' })
    expect(buildWhereClause(schema, [filter('u', 'eq', ['   '])]).clause).toBe(
      ''
    )
  })
})

describe('applyFilterPlaceholder', () => {
  const clause = 'WHERE user = {flt_0:String}'

  test('replaces the marker in a plain SQL string', () => {
    const sql: string = `SELECT * FROM t ${FILTER_PLACEHOLDER}`
    expect(applyFilterPlaceholder(sql, clause)).toBe(
      `SELECT * FROM t ${clause}`
    )
  })

  test('replaces the marker in every versioned SQL variant', () => {
    const versioned = [
      { sql: `SELECT a FROM t ${FILTER_PLACEHOLDER}` },
      { since: '24.1', sql: `SELECT a, b FROM t ${FILTER_PLACEHOLDER}` },
    ]
    const out = applyFilterPlaceholder(versioned as any, clause) as any
    expect(out[0].sql).toContain(clause)
    expect(out[1].sql).toContain(clause)
    expect(out[1].since).toBe('24.1')
  })

  test('replaces every occurrence of the marker', () => {
    const sql = `${FILTER_PLACEHOLDER} ... ${FILTER_PLACEHOLDER}`
    expect(applyFilterPlaceholder(sql, 'X').match(/X/g)).toHaveLength(2)
  })
})
