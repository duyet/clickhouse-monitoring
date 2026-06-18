import type { DeclarativeQueryConfig } from '../../schema'

export const replicatedMergeTreeSettingsDeclarative: DeclarativeQueryConfig = {
  name: 'replicated-merge-tree-settings',
  defaultView: 'auto',
  card: { primary: 'name', badges: ['changed', 'type'] },
  description:
    'Replicated MergeTree engine settings and whether each was changed from default',
  // system.replicated_merge_tree_settings may not exist on every server / version
  optional: true,
  tableCheck: 'system.replicated_merge_tree_settings',
  sql: `SELECT name, value, changed, description, type FROM system.replicated_merge_tree_settings ORDER BY name`,
  columns: ['name', 'value', 'changed', 'description', 'type'],
  columnFormats: {
    changed: 'boolean',
    value: 'code',
    type: 'colored-badge',
  },
}
