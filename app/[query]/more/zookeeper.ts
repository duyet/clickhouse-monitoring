import { ColumnFormat } from '@/components/data-table/column-defs'
import { type QueryConfig } from '@/lib/types/query-config'

export const zookeeperConfig: QueryConfig = {
  name: 'zookeeper',
  description: 'Zookeeper browser',
  sql: `
      SELECT
          name,
          path,
          value,
          dataLength,
          numChildren,
          ctime AS created_at,
          mtime AS updated_at,
          version,
          cversion,
          aversion,
          ephemeralOwner
      FROM system.zookeeper
      WHERE path = replaceOne({path: String}, '//', '/')
  `,
  columns: [
    'name',
    'path',
    'value',
    'dataLength',
    'numChildren',
    'created_at',
    'updated_at',
    'version',
    'cversion',
    'aversion',
    'ephemeralOwner',
  ],
  columnFormats: {
    name: [ColumnFormat.Link, { href: `/zookeeper?path=[path]/[name]` }],
    value: ColumnFormat.CodeToggle,
  },
  defaultParams: { path: '/' },
}
