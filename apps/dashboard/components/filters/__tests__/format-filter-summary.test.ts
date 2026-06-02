import type { ActiveFilter, FilterField } from '@/lib/filters/types'

import { formatFilterSummary } from '../filter-chip'
import { describe, expect, it } from 'bun:test'

const textField: FilterField = {
  key: 'query',
  label: 'Query',
  type: 'text',
}

const numberField: FilterField = {
  key: 'duration',
  label: 'Duration',
  type: 'number',
  unit: 'ms',
}

const withinHoursField: FilterField = {
  key: 'period',
  label: 'Period',
  type: 'select',
  options: [
    { value: '1', label: 'Last 1 hour' },
    { value: '24', label: 'Last 24 hours' },
  ],
}

describe('formatFilterSummary', () => {
  it('renders a simple eq filter as operator + first value', () => {
    const filter: ActiveFilter = {
      key: 'query',
      operator: 'eq',
      values: ['SELECT * FROM users'],
    }

    const result = formatFilterSummary(textField, filter)

    expect(result.operatorLabel).toBe('is')
    expect(result.valueText).toBe('SELECT * FROM users')
  })

  it('joins arity-2 operators (between) with an en-dash', () => {
    const filter: ActiveFilter = {
      key: 'duration',
      operator: 'between',
      values: ['100', '500'],
    }

    const result = formatFilterSummary(numberField, filter)

    // The function appends the unit at the end for number fields.
    expect(result.valueText).toBe('100 – 500 ms')
  })

  it('joins multi-arity operators with commas under threshold', () => {
    const filter: ActiveFilter = {
      key: 'query',
      operator: 'in',
      values: ['a', 'b'],
    }

    const result = formatFilterSummary(textField, filter)

    expect(result.valueText).toBe('a, b')
  })

  it('collapses multi-arity operators past 2 values to a count', () => {
    const filter: ActiveFilter = {
      key: 'query',
      operator: 'in',
      values: ['a', 'b', 'c', 'd'],
    }

    const result = formatFilterSummary(textField, filter)

    expect(result.valueText).toBe('4 selected')
  })

  it('uses the option label minus the "Last " prefix for withinHours', () => {
    const filter: ActiveFilter = {
      key: 'period',
      operator: 'withinHours',
      values: ['24'],
    }

    const result = formatFilterSummary(withinHoursField, filter)

    expect(result.valueText).toBe('24 hours')
  })

  it('falls back to "{value} hours" when no option label matches', () => {
    const filter: ActiveFilter = {
      key: 'period',
      operator: 'withinHours',
      values: ['72'],
    }

    const result = formatFilterSummary(withinHoursField, filter)

    expect(result.valueText).toBe('72 hours')
  })

  it('appends the unit only when field.type is number', () => {
    const textFilter: ActiveFilter = {
      key: 'query',
      operator: 'eq',
      values: ['hello'],
    }
    const fakeTextWithUnit: FilterField = {
      ...textField,
      unit: 'should-not-appear',
    }

    const result = formatFilterSummary(fakeTextWithUnit, textFilter)

    expect(result.valueText).toBe('hello')
  })

  it('returns empty value text for arity-1 with no values', () => {
    const filter: ActiveFilter = {
      key: 'query',
      operator: 'eq',
      values: [],
    }

    const result = formatFilterSummary(textField, filter)

    expect(result.valueText).toBe('')
  })
})
