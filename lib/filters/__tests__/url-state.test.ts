import type { FilterSchema } from '../types'

import {
  parseFiltersFromParams,
  parseFilterValue,
  serializeActiveFilters,
  serializeFilter,
} from '../url-state'
import { describe, expect, it } from 'bun:test'

const schema: FilterSchema = {
  fields: [
    {
      key: 'user',
      column: 'user',
      label: 'User',
      type: 'select',
      operators: ['in', 'notIn', 'eq'],
    },
    {
      key: 'query',
      column: 'query',
      label: 'Query text',
      type: 'text',
      operators: ['contains', 'eq'],
    },
    {
      key: 'excluded_users',
      column: 'user',
      label: 'Exclude user',
      type: 'select',
      operators: ['notIn'],
      defaultValue: { operator: 'notIn', value: 'monitoring' },
    },
  ],
}

const userField = schema.fields[0]
const queryField = schema.fields[1]

describe('parseFilterValue', () => {
  it('parses an explicit operator prefix', () => {
    expect(parseFilterValue(queryField, 'contains:hello')).toEqual({
      key: 'query',
      operator: 'contains',
      values: ['hello'],
    })
  })

  it('falls back to the default operator for a bare value', () => {
    expect(parseFilterValue(userField, 'default,monitoring')).toEqual({
      key: 'user',
      operator: 'in',
      values: ['default', 'monitoring'],
    })
  })

  it('keeps colons that belong to the value, not an operator', () => {
    expect(parseFilterValue(queryField, 'contains:a:b')).toEqual({
      key: 'query',
      operator: 'contains',
      values: ['a:b'],
    })
  })

  it('falls back to the default operator when the prefix is disallowed', () => {
    // `between` is not a recognized operator for the query field
    const result = parseFilterValue(queryField, 'between:x')
    expect(result?.operator).toBe('contains')
  })

  it('returns null for an empty value', () => {
    expect(parseFilterValue(queryField, 'contains:')).toBeNull()
  })
})

describe('parseFiltersFromParams', () => {
  it('applies a field default when the param is absent', () => {
    const filters = parseFiltersFromParams(schema, new URLSearchParams(''))
    expect(filters).toEqual([
      { key: 'excluded_users', operator: 'notIn', values: ['monitoring'] },
    ])
  })

  it('treats an explicit empty param as cleared, skipping the default', () => {
    const filters = parseFiltersFromParams(
      schema,
      new URLSearchParams('excluded_users=')
    )
    expect(filters).toEqual([])
  })

  it('parses explicit params and keeps defaults for other fields', () => {
    const filters = parseFiltersFromParams(
      schema,
      new URLSearchParams('user=in:default&query=contains:select')
    )
    expect(filters).toContainEqual({
      key: 'user',
      operator: 'in',
      values: ['default'],
    })
    expect(filters).toContainEqual({
      key: 'query',
      operator: 'contains',
      values: ['select'],
    })
    expect(filters).toContainEqual({
      key: 'excluded_users',
      operator: 'notIn',
      values: ['monitoring'],
    })
  })
})

describe('serializeFilter', () => {
  it('round-trips through parseFilterValue', () => {
    const original = {
      key: 'user',
      operator: 'in' as const,
      values: ['a', 'b'],
    }
    const serialized = serializeFilter(original)
    expect(serialized).toBe('in:a,b')
    expect(parseFilterValue(userField, serialized)).toEqual(original)
  })

  it('serializes a list of active filters into a record', () => {
    const record = serializeActiveFilters([
      { key: 'user', operator: 'eq', values: ['default'] },
      { key: 'query', operator: 'contains', values: ['x'] },
    ])
    expect(record).toEqual({ user: 'eq:default', query: 'contains:x' })
  })
})
