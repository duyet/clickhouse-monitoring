/**
 * Server-side `WHERE` clause builder.
 *
 * Turns a list of {@link ActiveFilter}s into a parameterized SQL fragment.
 * Security model:
 *   - Column names / SQL expressions come only from the trusted `FilterSchema`.
 *   - Operators are validated against the field's allowed operator list.
 *   - All user-supplied *values* are passed as ClickHouse query parameters
 *     (`{name:Type}`) and never interpolated into the SQL string.
 */

import type { VersionedSql } from '@/types/query-config'
import type {
  ActiveFilter,
  FilterField,
  FilterOperator,
  FilterSchema,
} from './types'

import { isMultiValueOperator } from './operators'

/** Comment marker in a SQL config where the dynamic `WHERE` is injected. */
export const FILTER_PLACEHOLDER = '/* __FILTERS__ */'

export interface BuiltWhere {
  /** `WHERE ...` fragment, or an empty string when there are no conditions. */
  clause: string
  /** ClickHouse query parameters for the placeholders in `clause`. */
  params: Record<string, unknown>
}

/** Comparison operators mapped to their SQL symbol. */
const COMPARISON_SYMBOLS: Partial<Record<FilterOperator, string>> = {
  eq: '=',
  ne: '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
}

/**
 * Build a parameterized `WHERE` clause from active filters.
 *
 * Filters referencing an unknown field, or using an operator the field does
 * not allow, are silently skipped — the schema is the single source of truth.
 */
export function buildWhereClause(
  schema: FilterSchema,
  filters: ActiveFilter[]
): BuiltWhere {
  const fieldByKey = new Map(schema.fields.map((f) => [f.key, f]))
  const params: Record<string, unknown> = {}
  const conditions: string[] = []
  let paramIndex = 0

  /** Register a value as a ClickHouse parameter, return its placeholder. */
  const addParam = (value: unknown, chType: string): string => {
    const name = `flt_${paramIndex++}`
    params[name] = value
    return `{${name}:${chType}}`
  }

  for (const filter of filters) {
    const field = fieldByKey.get(filter.key)
    if (!field) continue
    if (!field.operators.includes(filter.operator)) continue

    const condition = buildCondition(
      field,
      filter.operator,
      filter.values,
      addParam
    )
    if (condition) conditions.push(condition)
  }

  return {
    clause:
      conditions.length > 0
        ? `WHERE ${conditions.join('\n            AND ')}`
        : '',
    params,
  }
}

/** Build a single SQL condition for one field/operator/value(s) triple. */
function buildCondition(
  field: FilterField,
  operator: FilterOperator,
  rawValues: string[],
  addParam: (value: unknown, chType: string) => string
): string | null {
  const values = rawValues.map((v) => v.trim()).filter((v) => v.length > 0)
  if (values.length === 0) return null

  const col = field.column

  switch (operator) {
    case 'contains':
      return `positionCaseInsensitiveUTF8(toString(${col}), ${addParam(values[0], 'String')}) > 0`

    case 'notContains':
      return `positionCaseInsensitiveUTF8(toString(${col}), ${addParam(values[0], 'String')}) = 0`

    case 'in':
    case 'notIn': {
      const placeholders = values
        .map((v) => operandFor(field, v, addParam))
        .filter((p): p is string => p !== null)
      if (placeholders.length === 0) return null
      const keyword = operator === 'in' ? 'IN' : 'NOT IN'
      return `${col} ${keyword} (${placeholders.join(', ')})`
    }

    case 'between': {
      if (values.length < 2) return null
      const lower = operandFor(field, values[0], addParam)
      const upper = operandFor(field, values[1], addParam)
      if (lower === null || upper === null) return null
      return `${col} BETWEEN ${lower} AND ${upper}`
    }

    case 'withinHours':
      return `${col} > now() - toIntervalHour(toUInt64OrZero(${addParam(values[0], 'String')}))`

    case 'eq':
    case 'ne':
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const operand = operandFor(field, values[0], addParam)
      if (operand === null) return null
      return `${col} ${COMPARISON_SYMBOLS[operator]} ${operand}`
    }

    default:
      return null
  }
}

/**
 * Produce a typed ClickHouse parameter placeholder for a single value,
 * honoring the field type (numeric scaling, datetime parsing). Returns null
 * when the value cannot be coerced (e.g. a non-numeric input on a number
 * field) so the whole condition is dropped.
 */
function operandFor(
  field: FilterField,
  rawValue: string,
  addParam: (value: unknown, chType: string) => string
): string | null {
  if (field.type === 'number') {
    const parsed = Number(rawValue)
    if (!Number.isFinite(parsed)) return null
    const scaledValue = parsed * (field.scale ?? 1)
    if (!Number.isFinite(scaledValue)) return null
    return addParam(scaledValue, 'Float64')
  }

  if (field.type === 'datetime') {
    return `parseDateTimeBestEffortOrNull(${addParam(rawValue, 'String')})`
  }

  // text / select
  return addParam(rawValue, 'String')
}

/**
 * Replace the {@link FILTER_PLACEHOLDER} marker in a SQL definition with a
 * built `WHERE` clause. Works for both plain-string and versioned SQL.
 */
export function applyFilterPlaceholder<T extends string | VersionedSql[]>(
  sql: T,
  clause: string
): T {
  if (typeof sql === 'string') {
    return sql.split(FILTER_PLACEHOLDER).join(clause) as T
  }
  return sql.map((variant) => ({
    ...variant,
    sql: variant.sql.split(FILTER_PLACEHOLDER).join(clause),
  })) as T
}

/** Re-exported so callers can split a value the same way the parser does. */
export { isMultiValueOperator }
