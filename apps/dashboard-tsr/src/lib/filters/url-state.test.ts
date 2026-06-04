import type { FilterField, FilterSchema } from './types'

import {
  parseFiltersFromParams,
  parseFilterValue,
  serializeActiveFilters,
  serializeFilter,
} from './url-state'
import { describe, expect, test } from 'bun:test'

const userField: FilterField = {
  key: 'user',
  column: 'user',
  label: 'User',
  type: 'text',
  operators: ['eq', 'in', 'contains'],
}

const memField: FilterField = {
  key: 'mem',
  column: 'memory',
  label: 'Memory',
  type: 'number',
  operators: ['gt', 'between'],
}

describe('parseFilterValue', () => {
  test('parses an explicit operator:value fragment', () => {
    expect(parseFilterValue(userField, 'eq:default')).toEqual({
      key: 'user',
      operator: 'eq',
      values: ['default'],
    })
  })

  test('a bare value falls back to the field default operator', () => {
    expect(parseFilterValue(userField, 'default')).toEqual({
      key: 'user',
      operator: 'eq', // first in operators[]
      values: ['default'],
    })
  })

  test('a multi-value operator splits on commas', () => {
    expect(parseFilterValue(userField, 'in:a,b,c')?.values).toEqual([
      'a',
      'b',
      'c',
    ])
  })

  test('a known-but-disallowed operator prefix is still stripped, operator falls back to default', () => {
    // 'gt' is a recognized token so the prefix is consumed (value → '5'),
    // but the field disallows gt → operator resets to the default (eq).
    const parsed = parseFilterValue(userField, 'gt:5')
    expect(parsed?.operator).toBe('eq')
    expect(parsed?.values).toEqual(['5'])
  })

  test('an unrecognized prefix is treated as part of the value', () => {
    const parsed = parseFilterValue(userField, 'http://x')
    expect(parsed?.operator).toBe('eq')
    expect(parsed?.values).toEqual(['http://x'])
  })

  test('returns null when no usable value remains', () => {
    expect(parseFilterValue(userField, 'eq:   ')).toBeNull()
    expect(parseFilterValue(userField, 'in: , ,')).toBeNull()
  })
})

describe('parseFiltersFromParams', () => {
  const schema: FilterSchema = { fields: [userField, memField] }

  test('reads explicit params into active filters', () => {
    const params = new URLSearchParams('user=in:a,b&mem=gt:100')
    const filters = parseFiltersFromParams(schema, params)
    expect(filters).toHaveLength(2)
    expect(filters.find((f) => f.key === 'user')?.values).toEqual(['a', 'b'])
  })

  test('an explicit empty param clears the field (overrides default)', () => {
    const withDefault: FilterSchema = {
      fields: [
        { ...userField, defaultValue: { operator: 'eq', value: 'monitoring' } },
      ],
    }
    // ?user= present-but-empty → no filter, even though a default exists.
    const filters = parseFiltersFromParams(
      withDefault,
      new URLSearchParams('user=')
    )
    expect(filters).toHaveLength(0)
  })

  test('a missing param applies the field defaultValue', () => {
    const withDefault: FilterSchema = {
      fields: [
        { ...userField, defaultValue: { operator: 'eq', value: 'monitoring' } },
      ],
    }
    const filters = parseFiltersFromParams(withDefault, new URLSearchParams(''))
    expect(filters).toEqual([
      { key: 'user', operator: 'eq', values: ['monitoring'] },
    ])
  })
})

describe('serialize round-trip', () => {
  test('serializeFilter renders operator:value', () => {
    expect(
      serializeFilter({ key: 'user', operator: 'in', values: ['a', 'b'] })
    ).toBe('in:a,b')
  })

  test('serializeActiveFilters keys by field', () => {
    expect(
      serializeActiveFilters([
        { key: 'user', operator: 'eq', values: ['default'] },
        { key: 'mem', operator: 'gt', values: ['100'] },
      ])
    ).toEqual({ user: 'eq:default', mem: 'gt:100' })
  })

  test('parse(serialize(x)) === x for a multi-value filter', () => {
    const original = {
      key: 'user',
      operator: 'in' as const,
      values: ['a', 'b'],
    }
    const roundTripped = parseFilterValue(userField, serializeFilter(original))
    expect(roundTripped).toEqual(original)
  })
})
