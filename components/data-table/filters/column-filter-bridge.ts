/**
 * Bridge between per-column filter declarations and the schema-driven filter
 * system. A `ColumnFilterDef` (UI sugar on QueryConfig) only renders a header
 * filter popover when the schema declares a matching FilterField — the schema
 * stays the trusted SQL source.
 */

import type {
  FilterField,
  FilterOperator,
  FilterSchema,
} from '@/lib/filters/types'
import type { ColumnFilterDef } from '@/types/query-config'

const DEFAULT_OPERATOR: Record<ColumnFilterDef['type'], FilterOperator> = {
  text: 'contains',
  numeric: 'eq',
  date: 'eq',
  'date-range': 'between',
  'multi-select': 'in',
  boolean: 'eq',
}

export function defaultOperatorForType(
  type: ColumnFilterDef['type']
): FilterOperator {
  return DEFAULT_OPERATOR[type]
}

/**
 * Locate the schema field a column-filter declaration maps to.
 * Returns null when no field exists or the field's operators conflict with
 * the column-filter type — in those cases the header popover does not render.
 */
export function resolveColumnFilterField(
  columnName: string,
  def: ColumnFilterDef | undefined,
  schema: FilterSchema | undefined
): FilterField | null {
  if (!def || !schema) return null
  const key = def.fieldKey ?? columnName
  const field = schema.fields.find((f) => f.key === key) ?? null
  if (!field) return null
  const preferred = def.operator ?? defaultOperatorForType(def.type)
  if (!field.operators.includes(preferred)) return null
  return field
}

/** Initial operator a fresh column-filter popover should preselect. */
export function pickColumnFilterOperator(
  def: ColumnFilterDef,
  field: FilterField
): FilterOperator {
  const preferred = def.operator ?? defaultOperatorForType(def.type)
  if (field.operators.includes(preferred)) return preferred
  // Misconfigured schema field — fall back to the type default rather than
  // returning `undefined` from an empty operators array.
  return field.operators[0] ?? preferred
}
