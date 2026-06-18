import type { DeclarativeQueryConfig } from '../../schema'

export const mergeTreeSettingsDeclarative: DeclarativeQueryConfig = {
  name: 'mergetree-settings',
  optional: false,
  defaultView: 'auto',
  card: { primary: 'name', badges: ['changed', 'type'] },
  permission: { feature: 'settings' },
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
    changed: 'boolean',
    readonly: 'boolean',
    is_obsolete: 'boolean',
    value: 'code',
    type: 'colored-badge',
  },
}
