/**
 * Operator metadata — drives the operator dropdown, value-input arity, and
 * which operators are valid for a given field type.
 */

import type { FilterFieldType, FilterOperator } from './types'

/** Number of value inputs an operator needs. */
export type OperatorArity = 0 | 1 | 2 | 'multi'

export interface OperatorMeta {
  /** Label shown in the operator dropdown and on filter chips. */
  label: string
  /** How many value inputs to render. */
  arity: OperatorArity
  /** Field types this operator may be used with. */
  fieldTypes: FilterFieldType[]
}

export const OPERATORS: Record<FilterOperator, OperatorMeta> = {
  eq: {
    label: 'is',
    arity: 1,
    fieldTypes: ['text', 'number', 'select'],
  },
  ne: {
    label: 'is not',
    arity: 1,
    fieldTypes: ['text', 'number', 'select'],
  },
  contains: {
    label: 'contains',
    arity: 1,
    fieldTypes: ['text', 'select'],
  },
  notContains: {
    label: "doesn't contain",
    arity: 1,
    fieldTypes: ['text', 'select'],
  },
  in: {
    label: 'is any of',
    arity: 'multi',
    fieldTypes: ['text', 'select'],
  },
  notIn: {
    label: 'is none of',
    arity: 'multi',
    fieldTypes: ['text', 'select'],
  },
  gt: {
    label: 'greater than',
    arity: 1,
    fieldTypes: ['number', 'datetime'],
  },
  gte: {
    label: 'at least',
    arity: 1,
    fieldTypes: ['number', 'datetime'],
  },
  lt: {
    label: 'less than',
    arity: 1,
    fieldTypes: ['number', 'datetime'],
  },
  lte: {
    label: 'at most',
    arity: 1,
    fieldTypes: ['number', 'datetime'],
  },
  between: {
    label: 'between',
    arity: 2,
    fieldTypes: ['number', 'datetime'],
  },
  withinHours: {
    label: 'within last',
    arity: 1,
    fieldTypes: ['datetime'],
  },
}

/** All recognized operator tokens (used for URL parsing). */
export const KNOWN_OPERATORS = Object.keys(OPERATORS) as FilterOperator[]

/** Type guard for an unknown string. */
export function isFilterOperator(value: string): value is FilterOperator {
  return Object.hasOwn(OPERATORS, value)
}

/** True for operators that accept a comma-separated list of values. */
export function isMultiValueOperator(operator: FilterOperator): boolean {
  return OPERATORS[operator].arity === 'multi'
}

/** True for operators that take exactly two values (a range). */
export function isRangeOperator(operator: FilterOperator): boolean {
  return OPERATORS[operator].arity === 2
}
