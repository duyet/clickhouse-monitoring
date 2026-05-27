import { describe, expect, it } from 'bun:test'

import type { ColumnFilterDef } from '@/types/query-config'
import type { FilterField, FilterSchema } from '@/lib/filters/types'

import {
  defaultOperatorForType,
  pickColumnFilterOperator,
  resolveColumnFilterField,
} from '../column-filter-bridge'

const textField: FilterField = {
  key: 'query',
  column: 'query',
  label: 'Query',
  type: 'text',
  operators: ['contains', 'eq'],
}

const numericField: FilterField = {
  key: 'duration',
  column: 'query_duration_ms',
  label: 'Duration',
  type: 'number',
  operators: ['gt', 'lt', 'eq'],
}

const schema: FilterSchema = {
  fields: [textField, numericField],
}

describe('defaultOperatorForType', () => {
  it('returns the correct default per type', () => {
    expect(defaultOperatorForType('text')).toBe('contains')
    expect(defaultOperatorForType('numeric')).toBe('eq')
    expect(defaultOperatorForType('date')).toBe('eq')
    expect(defaultOperatorForType('date-range')).toBe('between')
    expect(defaultOperatorForType('multi-select')).toBe('in')
    expect(defaultOperatorForType('boolean')).toBe('eq')
  })
})

describe('resolveColumnFilterField', () => {
  it('returns null when def or schema is missing', () => {
    expect(resolveColumnFilterField('query', undefined, schema)).toBeNull()
    expect(
      resolveColumnFilterField('query', { type: 'text' }, undefined)
    ).toBeNull()
  })

  it('returns null when field is absent from schema', () => {
    expect(
      resolveColumnFilterField('nope', { type: 'text' }, schema)
    ).toBeNull()
  })

  it('returns the field when operators include the preferred operator', () => {
    const def: ColumnFilterDef = { type: 'text' }
    expect(resolveColumnFilterField('query', def, schema)).toBe(textField)
  })

  it('honors def.fieldKey override', () => {
    const def: ColumnFilterDef = { type: 'text', fieldKey: 'query' }
    expect(resolveColumnFilterField('q_col', def, schema)).toBe(textField)
  })

  it('returns null when no operator match', () => {
    const def: ColumnFilterDef = { type: 'date-range' } // wants `between`
    expect(resolveColumnFilterField('query', def, schema)).toBeNull()
  })

  it('honors explicit operator override', () => {
    const def: ColumnFilterDef = { type: 'text', operator: 'lt' }
    // 'lt' not in textField operators, should be null
    expect(resolveColumnFilterField('query', def, schema)).toBeNull()
    // 'gt' is in numericField operators, should resolve
    const def2: ColumnFilterDef = { type: 'numeric', operator: 'gt' }
    expect(resolveColumnFilterField('duration', def2, schema)).toBe(
      numericField
    )
  })
})

describe('pickColumnFilterOperator', () => {
  it('returns preferred operator when included in field.operators', () => {
    const def: ColumnFilterDef = { type: 'text' }
    expect(pickColumnFilterOperator(def, textField)).toBe('contains')
  })

  it('honors explicit def.operator override when supported', () => {
    const def: ColumnFilterDef = { type: 'text', operator: 'eq' }
    expect(pickColumnFilterOperator(def, textField)).toBe('eq')
  })

  it('falls back to the first operator when preferred is not supported', () => {
    const def: ColumnFilterDef = { type: 'text', operator: 'gt' }
    expect(pickColumnFilterOperator(def, textField)).toBe('contains')
  })
})
