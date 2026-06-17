import type { DeclarativeQueryConfig } from '../../schema'

export const zookeeperDeclarative: DeclarativeQueryConfig = {
  name: 'zookeeper',
  defaultView: 'auto',
  card: { primary: '_path' },
  description:
    'Exposes data from the Keeper cluster defined in the config. https://clickhouse.com/docs/en/operations/system-tables/zookeeper',
  // docs: ZOOKEEPER — not a URL, cannot be expressed declaratively; omitted
  optional: true,
  tableCheck: 'system.zookeeper',
  sql: `
      SELECT
          replaceOne(format('{}/{}', path, name), '//', '/') AS _path,
          value,
          dataLength,
          numChildren,
          ctime AS created_at,
          mtime AS updated_at,
          version AS num_node_changes,
          cversion AS num_child_changes
      FROM system.zookeeper
      WHERE path = replaceOne({path: String}, '//', '/')
      ORDER BY updated_at DESC
  `,
  columns: [
    '_path',
    'value',
    'dataLength',
    'numChildren',
    'created_at',
    'updated_at',
    'num_node_changes',
    'num_child_changes',
  ],
  columnFormats: {
    _path: ['link', { href: `?path=[_path]` }],
    value: 'code-toggle',
    created_at: 'related-time',
    updated_at: 'related-time',
  },
  defaultParams: { path: '/' },
  relatedCharts: [
    [
      'zookeeper-requests',
      {
        title: 'ZooKeeper Requests/Watch',
        interval: 'toStartOfDay',
        lastHours: 24 * 14,
      },
    ],
    'break',
    [
      'zookeeper-wait',
      {
        title: 'ZooKeeper Wait Seconds',
        interval: 'toStartOfDay',
        lastHours: 24 * 14,
      },
    ],
    'break',
    'zookeeper-uptime',
    'zookeeper-summary-table',
    ['zookeeper-exception', {}],
    'break',
  ],
}
