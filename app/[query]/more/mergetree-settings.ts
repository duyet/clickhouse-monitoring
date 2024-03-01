import { type QueryConfig } from '@/lib/types/query-config'
import { ColumnFormat } from '@/components/data-table/column-defs'

export const mergeTreeSettingsConfig: QueryConfig = {
  name: 'mergetree-settings',
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
