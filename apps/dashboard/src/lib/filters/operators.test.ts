import type { FilterOperator } from './types'

import {
  isFilterOperator,
  isMultiValueOperator,
  isRangeOperator,
  KNOWN_OPERATORS,
  OPERATORS,
} from './operators'
import { describe, expect, test } from 'bun:test'

describe('OPERATORS metadata', () => {
  test('every operator declares a label, arity and field types', () => {
    for (const meta of Object.values(OPERATORS)) {
      expect(meta.label.length).toBeGreaterThan(0)
      expect(meta.fieldTypes.length).toBeGreaterThan(0)
      expect([0, 1, 2, 'multi']).toContain(meta.arity)
    }
    expect(KNOWN_OPERATORS).toEqual(Object.keys(OPERATORS) as FilterOperator[])
  })
})

describe('isFilterOperator', () => {
  test('accepts known tokens, rejects unknown ones', () => {
    expect(isFilterOperator('eq')).toBe(true)
    expect(isFilterOperator('withinHours')).toBe(true)
    expect(isFilterOperator('nope')).toBe(false)
    expect(isFilterOperator('')).toBe(false)
    expect(isFilterOperator('toString')).toBe(false) // not a prototype key leak
  })
})

describe('isMultiValueOperator', () => {
  test('true only for arity:multi operators', () => {
    expect(isMultiValueOperator('in')).toBe(true)
    expect(isMultiValueOperator('notIn')).toBe(true)
    expect(isMultiValueOperator('eq')).toBe(false)
    expect(isMultiValueOperator('between')).toBe(false)
  })
})

describe('isRangeOperator', () => {
  test('true only for arity:2 operators', () => {
    expect(isRangeOperator('between')).toBe(true)
    expect(isRangeOperator('in')).toBe(false)
    expect(isRangeOperator('gt')).toBe(false)
  })
})
