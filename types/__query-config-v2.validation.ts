/**
 * Type validation file for QueryConfig v2
 * This file is excluded from build but helps validate types during development
 * See tsconfig.json exclude patterns
 */

import { ColumnFormat } from './column-format'
import type {
  BuiltInSortingFn,
  ChartReference,
  ColumnFormatSpec,
  ContextKey,
  FormatOptionsMap,
  FormatsRequiringOptions,
  FormatsWithOptionalOptions,
  FormatsWithoutOptions,
  QueryConfig,
  RowKeys,
  TemplatePlaceholder,
  TypedColumnFormats,
  TypedColumnIcons,
  TypedFilterPreset,
  TypedSortingFns,
  ValidatedTemplate,
} from './query-config-v2'

/**
 * Test Case 1: RowKeys extracts string keys from a row type
 */
type TestRow1 = {
  id: string
  name: string
  count: number
  active: boolean
}

type ExtractedKeys = RowKeys<TestRow1>
// Assert: string literal union is created
// TypeScript will validate these assignments
const _: ExtractedKeys = 'id'
const __: ExtractedKeys = 'name'
const ___: ExtractedKeys = 'count'
const ____: ExtractedKeys = 'active'

/**
 * Test Case 2-4: Template and format validation works
 */
type TemplatePlaceholders = TemplatePlaceholder<TestRow1>
type LinkSpec = ColumnFormatSpec<TestRow1, ColumnFormat.Link>
type TextSpec = ColumnFormatSpec<TestRow1, ColumnFormat.Text>
type BadgeSpec = ColumnFormatSpec<TestRow1, ColumnFormat.Badge>

/**
 * Test Case 5-8: Column property validation
 */
type Formats = TypedColumnFormats<TestRow1>
type Icons = TypedColumnIcons<TestRow1>
type Sorting = TypedSortingFns<TestRow1>
type FilterPreset = TypedFilterPreset<TestRow1>

/**
 * Test Case 9-12: Full integration test
 */
const _testConfig: QueryConfig<TestRow1> = {
  name: 'test_view',
  description: 'Test configuration',
  sql: 'SELECT id, name, count, active FROM table',
  columns: ['id', 'name', 'count', 'active'],
  columnFormats: {
    id: ColumnFormat.Badge,
    name: ColumnFormat.Text,
    count: ColumnFormat.Number,
    active: ColumnFormat.Boolean,
  },
  columnIcons: {
    active: undefined as any,
  },
  sortingFns: {
    name: 'alphanumeric',
    count: 'auto',
  },
  filterParamPresets: [
    {
      name: 'Active Items',
      key: 'active',
      value: 'true',
    },
  ],
  relatedCharts: ['disk-usage', ['memory-usage', { height: 400 }]],
  optional: false,
}

/**
 * Test Case 13: Default generic parameter works
 */
const _defaultConfig: QueryConfig = {
  name: 'any_config',
  sql: 'SELECT *',
  columns: ['anything'],
}

/**
 * Test Case 14: Built-in sorting functions
 */
const _sf1: BuiltInSortingFn = 'alphanumeric'
const _sf2: BuiltInSortingFn = 'auto'
const _sf3: BuiltInSortingFn = 'datetime'

/**
 * Test Case 15: Context keys and chart references
 */
const _ck1: ContextKey = 'hostId'
const _ck2: ContextKey = 'database'
const _chart1: ChartReference = 'disk-usage'
const _chart2: ChartReference = ['memory-usage', { height: 400 }]

/**
 * Test Case 16: Format options and categorization
 */
type _OptionsMap = FormatOptionsMap<TestRow1>
type _RequiringOpts = FormatsRequiringOptions
type _OptionalOpts = FormatsWithOptionalOptions
type _NoOpts = FormatsWithoutOptions

// Export a dummy value to make this a module
export const VALIDATION_COMPLETE = true
