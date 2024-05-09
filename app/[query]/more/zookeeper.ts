import { ColumnFormat } from '@/components/data-table/column-defs'
import { type QueryConfig } from '@/lib/types/query-config'

export const zookeeperConfig: QueryConfig = {
  name: 'zookeeper',
  description:
    'Exposes data from the Keeper cluster defined in the config. https://clickhouse.com/docs/en/operations/system-tables/zookeeper',
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
    _path: [ColumnFormat.Link, { href: `/zookeeper?path=[_path]` }],
    value: ColumnFormat.CodeToggle,
    created_at: ColumnFormat.RelatedTime,
    updated_at: ColumnFormat.RelatedTime,
  },
  defaultParams: { path: '/' },
  relatedCharts: [
    [
      'ZooKeeperRequestsChart',
      {
        title: 'ZooKeeper Requests Over Time',
        interval: 'toStartOfHour',
        lastHours: 24 * 7,
      },
    ],
  ],
}
