import { type QueryConfig } from '@/lib/types/query-config'
import { ColumnFormat } from '@/components/data-table/column-defs'

export const settingsConfig: QueryConfig = {
  name: 'settings',
  sql: `
      SELECT *
      FROM system.settings
      ORDER BY name
    `,
  columns: ['name', 'value', 'changed', 'description', 'default'],
  columnFormats: {
    name: ColumnFormat.Code,
    changed: ColumnFormat.Boolean,
    value: ColumnFormat.Code,
    default: ColumnFormat.Code,
  },
}
