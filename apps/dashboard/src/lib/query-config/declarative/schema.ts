/**
 * Declarative query-config schema — the catalog contract.
 *
 * This module defines the SERIALIZABLE subset of QueryConfig that can live in
 * a JSON / YAML / TOML file and be contributed by the community without
 * requiring TypeScript knowledge.
 *
 * The companion loader (Plan 02b) will map a DeclarativeQueryConfig into the
 * in-memory QueryConfig that the dashboard consumes at runtime. Fields that
 * are runtime functions (rowClassName, expandable, columnIcons, filterSchema
 * with Icon refs, FeaturePermission) are intentionally excluded here — they
 * cannot be expressed declaratively and must be wired up by the loader.
 *
 * Serializable fields carried here:
 *   identity:       name, description, docs, suggestion
 *   sql:            string | VersionedSql[]
 *   columns:        string[]
 *   columnFormats:  record of column → format spec (enum or [enum, args])
 *   columnDescriptions, columnSizing, tableBehavior
 *   defaultParams, filterParamPresets (icon omitted — not serializable)
 *   optional, tableCheck, disableSqlValidation, refreshInterval
 *   relatedCharts:  string[] | [string, params][]
 *   card, defaultView, bulkActions, bulkActionKey
 *   sortingFns
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Version string: looks like "23.8", "24.1", "25.6.0", etc.
// ---------------------------------------------------------------------------

const versionPattern = /^\d+\.\d+(\.\d+)*$/

const versionStringSchema = z
  .string()
  .regex(versionPattern, 'version must match X.Y or X.Y.Z format (e.g. "23.8")')

// ---------------------------------------------------------------------------
// SQL: plain string or versioned array
// ---------------------------------------------------------------------------

export const versionedSqlEntrySchema = z.object({
  since: versionStringSchema,
  sql: z.string().min(1, 'sql string must not be empty'),
  description: z.string().optional(),
})

export const sqlSchema = z.union([
  z.string().min(1, 'sql must not be empty'),
  z
    .array(versionedSqlEntrySchema)
    .min(1, 'versioned sql array must have at least one entry'),
])

// ---------------------------------------------------------------------------
// ColumnFormat enum values (mirrors ColumnFormat enum from types/column-format)
// ---------------------------------------------------------------------------

const columnFormatValues = [
  'background-bar',
  'colored-badge',
  'related-time',
  'number-short',
  'code-toggle',
  'code-dialog',
  'running-query-summary',
  'hover-card',
  'duration',
  'markdown',
  'boolean',
  'boolean-inverted',
  'action',
  'inline-action',
  'number',
  'badge',
  'code',
  'link',
  'text',
  'none',
] as const

const columnFormatEnumSchema = z.enum(columnFormatValues)

// ---------------------------------------------------------------------------
// Per-format args schemas (serializable subset of ColumnFormatWithArgs)
//
// For formats whose options are complex or component-coupled (RunningQuerySummary,
// HoverCard), we accept a permissive record so contributors can still pass args;
// the loader validates further at runtime.
// TODO: tighten Action[], CodeDialogOptions, LinkFormatOptions shapes once
//       those types are fully stable and independently importable.
// ---------------------------------------------------------------------------

const columnFormatArgsSchema = z.record(z.string(), z.unknown())

// A column format is either a bare enum string, or a [enum, args] tuple.
const columnFormatSpecSchema = z.union([
  columnFormatEnumSchema,
  z.tuple([columnFormatEnumSchema, columnFormatArgsSchema]),
  z.tuple([columnFormatEnumSchema, z.array(z.unknown())]),
])

// ---------------------------------------------------------------------------
// columnSizing
// ---------------------------------------------------------------------------

const columnSizingEntrySchema = z.object({
  size: z.number().positive().optional(),
  minSize: z.number().positive().optional(),
  maxSize: z.number().positive().optional(),
})

// ---------------------------------------------------------------------------
// tableBehavior
// ---------------------------------------------------------------------------

const tableBehaviorSchema = z.object({
  enableColumnResizing: z.boolean().optional(),
  columnResizeMode: z.enum(['onChange', 'onEnd']).optional(),
  enableSorting: z.boolean().optional(),
  enableColumnReordering: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// filterParamPresets — icon is a React component, intentionally excluded
// ---------------------------------------------------------------------------

const filterParamPresetSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  value: z.string(),
  // icon intentionally excluded — not serializable (React component reference)
})

// ---------------------------------------------------------------------------
// card config
// ---------------------------------------------------------------------------

const cardConfigSchema = z.object({
  primary: z.string().optional(),
  badges: z.array(z.string()).optional(),
  metrics: z.array(z.string()).optional(),
  hidden: z.array(z.string()).optional(),
})

// ---------------------------------------------------------------------------
// relatedCharts: string names or [name, params] tuples
// ---------------------------------------------------------------------------

const relatedChartSchema = z.union([
  z.string().min(1),
  z.tuple([z.string().min(1), z.record(z.string(), z.unknown())]),
])

// ---------------------------------------------------------------------------
// sortingFns
// ---------------------------------------------------------------------------

const sortingFnValues = [
  'sort_column_using_pct',
  'sort_column_using_pct_inverted',
] as const

const sortingFnsSchema = z.record(z.string(), z.enum(sortingFnValues))

// ---------------------------------------------------------------------------
// Main declarative schema
// ---------------------------------------------------------------------------

export const declarativeQueryConfigSchema = z.object({
  // Identity
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
  docs: z.string().url().optional(),
  suggestion: z.string().optional(),

  // SQL
  sql: sqlSchema,

  // Columns
  columns: z
    .array(z.string().min(1))
    .min(1, 'columns must have at least one entry'),

  // Column display
  columnFormats: z.record(z.string(), columnFormatSpecSchema).optional(),
  columnDescriptions: z.record(z.string(), z.string()).optional(),
  columnSizing: z.record(z.string(), columnSizingEntrySchema).optional(),

  // Table behavior
  tableBehavior: tableBehaviorSchema.optional(),

  // Query parameters
  defaultParams: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),

  // Filters
  filterParamPresets: z.array(filterParamPresetSchema).optional(),
  // filterSchema intentionally excluded — FilterField.icon is a React component
  // and FilterFieldDynamicOptions contains Icon refs; the loader wires it from TS.

  // Optional table handling
  optional: z.boolean().default(false),
  tableCheck: z.union([z.string(), z.array(z.string())]).optional(),

  // Validation toggle
  disableSqlValidation: z.boolean().optional(),

  // Refresh
  refreshInterval: z.number().positive().optional(),

  // Related charts
  relatedCharts: z.array(relatedChartSchema).optional(),

  // Card / view
  card: cardConfigSchema.optional(),
  defaultView: z.enum(['table', 'cards', 'auto']).optional(),

  // Bulk actions
  bulkActions: z.array(z.string()).optional(),
  bulkActionKey: z.string().optional(),

  // Sorting
  sortingFns: sortingFnsSchema.optional(),

  // Intentionally excluded (not serializable — require runtime code):
  //   columnIcons     — React component refs
  //   rowClassName    — function (row) => string
  //   expandable      — function (row, ctx) => ReactNode
  //   permission      — FeaturePermission (app-level import)
  //   variants        — deprecated; use versioned sql[] instead
})

export type DeclarativeQueryConfig = z.infer<
  typeof declarativeQueryConfigSchema
>
