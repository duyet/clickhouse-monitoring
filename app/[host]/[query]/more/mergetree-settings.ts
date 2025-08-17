import { ColumnFormat } from '@/types/column-format'
import { type QueryConfig } from '@/types/query-config'

export const mergeTreeSettingsConfig: QueryConfig = {
  name: 'mergetree-settings',
  tableCheck: 'system.merge_tree_settings',
  sql: `
      SELECT name, value, changed, description, readonly, min, max, type, is_obsolete
      FROM system.merge_tree_settings
      ORDER BY name
    `,
  columns: [
    'name',
    'value',
    'changed',
    'description',
    'readonly',
    'min',
    'max',
    'type',
    'is_obsolete',
  ],
  columnFormats: {
    changed: ColumnFormat.Boolean,
    readonly: ColumnFormat.Boolean,
    is_obsolete: ColumnFormat.Boolean,
    value: ColumnFormat.Code,
    type: ColumnFormat.ColoredBadge,
  },
}
