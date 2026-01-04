import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

export const dictionariesConfig: QueryConfig = {
  name: 'dictionaries',
  description: 'External dictionaries loaded in ClickHouse',
  sql: `
    SELECT
      database,
      name,
      status,
      origin,
      type,
      key.names as key_names,
      key.types as key_types,
      attribute.names as attribute_names,
      attribute.types as attribute_types,
      bytes_allocated,
      formatReadableSize(bytes_allocated) as readable_bytes_allocated,
      hierarchical,
      is_injective,
      element_count,
      formatReadableQuantity(element_count) as readable_element_count,
      load_factor,
      loading_start_time,
      loading_duration,
      last_successful_update_time,
      last_exception,
      source
    FROM system.dictionaries
    ORDER BY database, name
  `,
  columns: [
    'database',
    'name',
    'status',
    'type',
    'readable_bytes_allocated',
    'readable_element_count',
    'load_factor',
    'loading_duration',
    'last_successful_update_time',
    'last_exception',
  ],
  columnFormats: {
    database: ColumnFormat.ColoredBadge,
    name: ColumnFormat.Text,
    status: ColumnFormat.ColoredBadge,
    type: ColumnFormat.ColoredBadge,
    readable_bytes_allocated: ColumnFormat.BackgroundBar,
    readable_element_count: ColumnFormat.Number,
    load_factor: ColumnFormat.Number,
    loading_duration: ColumnFormat.Duration,
    last_successful_update_time: ColumnFormat.RelatedTime,
    last_exception: [
      ColumnFormat.CodeDialog,
      { max_truncate: 40, dialog_title: 'Dictionary Exception' },
    ],
  },
  relatedCharts: ['dictionary-memory-usage', 'dictionary-load-times'],
}
