import { ColumnFormat } from '@/components/data-table/column-defs'
import { type QueryConfig } from '@/lib/types/query-config'

export const zookeeperConfig: QueryConfig = {
  name: 'zookeeper',
  description: 'Zookeeper browser',
  sql: `
      SELECT *
      FROM system.zookeeper
      WHERE path = replaceOne({path: String}, '//', '/')
  `,
  columns: [
    'name',
    'value',
    'path',
    'dataLength',
    'numChildren',
    'czxid',
    'mzxid',
    'ctime',
    'mtime',
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
