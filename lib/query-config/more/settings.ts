import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

export const settingsConfig: QueryConfig = {
  name: 'settings',
  tableCheck: 'system.settings',
  sql: `
      SELECT *
      FROM system.settings
      WHERE if({changed: String} != '', changed = {changed: String}, true)
      ORDER BY name
  `,
  columns: ['name', 'value', 'changed', 'description', 'default'],
  columnFormats: {
    name: ColumnFormat.Code,
    changed: ColumnFormat.Boolean,
    value: ColumnFormat.Code,
    default: ColumnFormat.Code,
    description: ColumnFormat.Markdown,
  },
  defaultParams: {
    changed: '',
  },
  filterParamPresets: [
    {
      name: 'Changed only',
      key: 'changed',
      value: '1',
    },
  ],
}
